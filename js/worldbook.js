// ---------- 世界书系统 ----------
// 触发规则完全交给 SillyTavern：ctx.getWorldInfoPrompt 是酒馆自己的世界书引擎
// （扫描深度 / 递归扫描 / 概率 / 预算 / 粘性冷却等全部由它决定），本程序只负责
// 「读取激活结果 → 按排除名单过滤 → 按酒馆的 before/after 位置注入」。
// TauriTavern 的 getWorldInfoPrompt 会额外返回 worldInfoActivation.entries
// （每个触发条目的 world+uid 稳定身份、内容与位置），这是「按条目排除」的基础；
// 未提供该字段的宿主降级为「原样注入酒馆拼好的文本」，条目排除不可用。
// 注意：绝不自己实现触发规则——按关键词自己过滤就是隔壁 NPC Tracker 的降级路径，
// 那会绕过酒馆的概率 / 预算 / 递归 / 粘性冷却等语义，属于要避免的设计。

function getStWorldInfoIncludeNames() {
  // 酒馆「世界书扫描包含角色名前缀」的设置（默认开启）。设置面板常驻 DOM 时读实时值。
  const checkbox = document.getElementById('world_info_include_names');
  if (checkbox && typeof checkbox.checked === 'boolean') return checkbox.checked;
  return true;
}

// 与酒馆生成时构造扫描 chat 的方式一致：非 system 消息、可选 name 前缀、最新在前。
// 注意：必须是「最新在前」，NPC Tracker 传正序 chat 会让触发扫描作用在旧消息上。
function buildWorldInfoScanChat(ctx) {
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const includeNames = getStWorldInfoIncludeNames();
  const lines = [];
  for (const message of chat) {
    if (!message || message.is_system) continue;
    const text = String(message.mes || '').trim();
    if (!text) continue;
    const name = String(message.name || '').trim();
    lines.push(includeNames && name ? `${name}: ${text}` : text);
  }
  return lines.reverse();
}

// 与酒馆生成时构造 globalScanData 的方式一致（见 ST generateRawData）：角色卡字段
// （描述/性格/深度提示/场景/创作备注）+ 当前 persona，供「匹配角色描述 / 匹配场景」等
// 触发条件使用；trigger 固定为 normal，对应普通生成（GENERATION_TYPE_TRIGGERS 包含 normal）。
function buildWorldInfoGlobalScanData(ctx) {
  const scanData = {
    personaDescription: '',
    characterDescription: '',
    characterPersonality: '',
    characterDepthPrompt: '',
    scenario: '',
    creatorNotes: '',
    trigger: 'normal',
  };
  if (!ctx || typeof ctx.getCharacterCardFields !== 'function') return scanData;
  try {
    const fields = ctx.getCharacterCardFields() || {};
    scanData.personaDescription = String(fields.persona ?? '');
    scanData.characterDescription = String(fields.description ?? '');
    scanData.characterPersonality = String(fields.personality ?? '');
    scanData.characterDepthPrompt = String(fields.charDepthPrompt ?? '');
    scanData.scenario = String(fields.scenario ?? '');
    scanData.creatorNotes = String(fields.creatorNotes ?? '');
  } catch (error) {
    console.warn(`[${MODULE_NAME}] getCharacterCardFields failed`, error);
  }
  return scanData;
}

async function getStWorldInfoActivation(ctx) {
  if (!ctx || typeof ctx.getWorldInfoPrompt !== 'function') return null;
  try {
    const scanChat = buildWorldInfoScanChat(ctx);
    const maxContext = Number(ctx.maxContext) || 0;
    // 第三参传 true 表示 dry run：只计算激活结果，不派发 WORLD_INFO_ACTIVATED 等副作用事件。
    // 第四参 globalScanData 必须传：TauriTavern 的 getWorldInfoPrompt 会直接读
    // globalScanData.trigger 组装 worldInfoActivation，不传会在其内部抛
    // "Cannot read properties of undefined (reading 'trigger')"，导致整个世界书系统静默降级。
    const result = await ctx.getWorldInfoPrompt(
      scanChat,
      maxContext > 0 ? maxContext : undefined,
      true,
      buildWorldInfoGlobalScanData(ctx),
    );
    return result && typeof result === 'object' ? result : null;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] getWorldInfoPrompt failed`, error);
    return null;
  }
}

// 排除名单的身份键：书名 + 条目 uid（酒馆自己的稳定身份），
// 不用显示名——显示名可能重复 / 被改写，NPC Tracker 的「书名 :: 条目名」匹配
// 还需要 sanitize 各种脏数据，属于不必要的脆弱设计。
function worldInfoEntryKey(bookName, uid) {
  return `${String(bookName || '').trim()}\u0000${String(uid ?? '').trim()}`;
}

function getWorldInfoExcludedKeys(settings) {
  const keys = new Set();
  const excluded = settings?.worldInfo?.excluded;
  if (!excluded || typeof excluded !== 'object') return keys;
  for (const [bookName, uids] of Object.entries(excluded)) {
    if (!bookName || !Array.isArray(uids)) continue;
    for (const uid of uids) {
      if (uid !== undefined && uid !== null && uid !== '') keys.add(worldInfoEntryKey(bookName, uid));
    }
  }
  return keys;
}

function isWorldInfoEntryExcluded(excludedKeys, entry) {
  if (!excludedKeys || excludedKeys.size === 0) return false;
  const world = String(entry?.world || '').trim();
  const uid = String(entry?.uid ?? '').trim();
  if (!world || !uid) return false;
  return excludedKeys.has(worldInfoEntryKey(world, uid));
}

function normalizeWorldInfoPosition(position) {
  // TauriTavern 的 worldInfoActivation.entries 里 position 已是字符串名（before/after/...），
  // loadWorldInfo 的原始书条目里是数字（0-7），两种都要兼容。
  if (position === 'before' || position === 'after' || position === 'an_top'
    || position === 'an_bottom' || position === 'depth' || position === 'em_top'
    || position === 'em_bottom' || position === 'outlet') {
    return position;
  }
  switch (Number(position)) {
    case 0: return 'before';
    case 1: return 'after';
    case 2: return 'an_top';
    case 3: return 'an_bottom';
    case 4: return 'depth';
    case 5: return 'em_top';
    case 6: return 'em_bottom';
    case 7: return 'outlet';
    default: return undefined;
  }
}

function getWorldInfoPositionLabel(position) {
  return WORLD_INFO_POSITION_LABELS[position] || '未知位置';
}

function getWorldInfoEntryDisplayName(entry) {
  if (!entry || typeof entry !== 'object') return String(entry ?? '');
  const comment = String(entry.comment || '').trim();
  if (comment) return comment;
  if (Array.isArray(entry.key)) {
    const firstKey = entry.key.find((value) => String(value || '').trim());
    if (firstKey !== undefined) return String(firstKey).trim();
  }
  const keys = String(entry.keys || '').trim();
  if (keys) return keys.split(',')[0].trim();
  return String(entry.uid ?? '');
}

// 把 ST 引擎给出的激活条目按「注入前 / 注入后 / 其他位置」组装成文本块：
// 组装方式与酒馆一致（同一位置内按激活顺序 unshift，使低 order 条目在前），
// 排除名单在此处生效；before 进开头块、after 进结尾块，AN / 深度 / 示例 / 出口
// 等位置在档案分析提示词里没有对应槽位，统一进 <World_Info_Extra> 补充块——
// 它们仍是酒馆规则触发的世界书背景（用户世界书大量用 AN 位置放角色描述），
// 只跳过内容为空的条目。
function buildPositionedWorldInfoBlocks(result, excludedKeys) {
  const before = [];
  const after = [];
  const extra = [];
  const included = [];
  const excluded = [];
  const skipped = [];
  const activation = result?.worldInfoActivation;
  const entries = Array.isArray(activation?.entries) ? activation.entries : [];
  for (const entry of entries) {
    const content = String(entry?.content || '').trim();
    if (!content) {
      skipped.push(entry);
      continue;
    }
    if (isWorldInfoEntryExcluded(excludedKeys, entry)) {
      excluded.push(entry);
      continue;
    }
    const position = normalizeWorldInfoPosition(entry?.position);
    if (position === 'before') before.unshift(content);
    else if (position === 'after') after.unshift(content);
    else extra.unshift(content);
    included.push(entry);
  }
  return {
    before: before.length > 0 ? before.join('\n') : '',
    after: after.length > 0 ? after.join('\n') : '',
    extra: extra.length > 0 ? extra.join('\n') : '',
    included,
    excluded,
    skipped,
  };
}

const NO_WORLD_INFO = Object.freeze({
  mode: 'none',
  before: '',
  after: '',
  extra: '',
  counts: Object.freeze({ included: 0, excluded: 0, skipped: 0 }),
  names: Object.freeze({ included: [], excluded: [], skipped: [] }),
});

// 档案分析用的世界书解析：返回 { mode, before, after, counts }。
// mode = 'entries'（按条目过滤，排除生效）| 'strings'（酒馆原文整体注入）| 'none'。
// 日志用的条目标签：显示名优先，兜底 书名#uid。
function worldInfoEntryLabel(entry) {
  const displayName = String(entry?.displayName || '').trim();
  if (displayName) return displayName;
  return `${String(entry?.world || '').trim()}#${String(entry?.uid ?? '').trim()}`;
}

async function resolveWorldInfoForAnalysis() {
  const ctx = getContextSafe();
  if (!ctx || typeof ctx.getWorldInfoPrompt !== 'function') return NO_WORLD_INFO;
  const result = await getStWorldInfoActivation(ctx);
  if (!result) return NO_WORLD_INFO;
  const activation = result.worldInfoActivation;
  if (Array.isArray(activation?.entries)) {
    const excludedKeys = getWorldInfoExcludedKeys(getSettings(ctx));
    const blocks = buildPositionedWorldInfoBlocks(result, excludedKeys);
    return {
      mode: 'entries',
      before: blocks.before,
      after: blocks.after,
      extra: blocks.extra,
      counts: { included: blocks.included.length, excluded: blocks.excluded.length, skipped: blocks.skipped.length },
      names: {
        included: blocks.included.map(worldInfoEntryLabel),
        excluded: blocks.excluded.map(worldInfoEntryLabel),
        skipped: blocks.skipped.map(worldInfoEntryLabel),
      },
    };
  }
  // 宿主未提供条目级激活数据：原样注入酒馆拼好的文本（无法按条目排除）。
  return {
    mode: 'strings',
    before: String(result.worldInfoBefore || '').trim(),
    after: String(result.worldInfoAfter || '').trim(),
    extra: '',
    counts: { included: 0, excluded: 0, skipped: 0 },
    names: { included: [], excluded: [], skipped: [] },
  };
}

// 世界书视图：收集「当前激活的书」名单。
// 来源：本次激活结果（必然激活）+ 角色主世界书 + /getcharbook 兜底 +
// 聊天绑定书 + 人设书 + 全局书多选框（#world_info）。
async function getActiveWorldBookNames(ctx, result) {
  const names = new Set();
  const push = (value) => {
    const name = String(value || '').trim();
    if (name) names.add(name);
  };
  const activation = result?.worldInfoActivation;
  if (Array.isArray(activation?.entries)) {
    for (const entry of activation.entries) push(entry?.world);
  }
  const character = Array.isArray(ctx?.characters) && Number.isInteger(ctx?.characterId) ? ctx.characters[ctx.characterId] : null;
  push(character?.data?.extensions?.world);
  if (typeof globalThis.STscript === 'function') {
    try {
      const pipe = await globalThis.STscript('/getcharbook');
      push(pipe?.pipe ?? pipe);
    } catch (error) {
      console.warn(`[${MODULE_NAME}] /getcharbook failed`, error);
    }
  }
  push(ctx?.chatMetadata?.world_info);
  push(ctx?.powerUserSettings?.persona_description_lorebook);
  try {
    const select = document.getElementById('world_info');
    if (select?.selectedOptions) {
      for (const option of select.selectedOptions) push(option.textContent || option.label || option.value);
    }
  } catch {}
  return names;
}

async function loadWorldBookEntries(ctx, bookName) {
  const name = String(bookName || '').trim();
  if (!name || typeof ctx?.loadWorldInfo !== 'function') return [];
  try {
    const book = await ctx.loadWorldInfo(name);
    const entries = book?.entries;
    if (!entries || typeof entries !== 'object') return [];
    const list = Array.isArray(entries) ? entries : Object.values(entries);
    const loaded = [];
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      loaded.push({
        world: name,
        uid: entry.uid,
        displayName: getWorldInfoEntryDisplayName(entry),
        constant: entry.constant === true,
        disabled: entry.disable === true,
        position: normalizeWorldInfoPosition(entry.position),
        content: String(entry.content || '').trim(),
      });
    }
    return loaded;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] loadWorldInfo "${name}" failed`, error);
    return [];
  }
}

function getWorldBookModeText(mode) {
  switch (mode) {
    case 'entries': return '激活引擎正常';
    case 'strings': return '酒馆规则生效';
    case 'none': return '世界书引擎不可用';
    default: return '未知状态';
  }
}

function refreshHomeWorldBookStatus() {
  const status = document.getElementById(HOME_WORLDBOOK_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const settings = ctx ? getSettings(ctx) : null;
    const excludedCount = getWorldBookExcludedTotal(settings);
    const engineOk = Boolean(ctx && typeof ctx.getWorldInfoPrompt === 'function');
    if (!engineOk) {
      status.textContent = '引擎不可用';
      status.dataset.state = 'error';
    } else if (excludedCount > 0) {
      status.textContent = `已排除 ${excludedCount} 条`;
      status.dataset.state = 'ok';
    } else {
      status.textContent = '跟随酒馆规则';
      status.dataset.state = 'idle';
    }
  } catch (error) {
    status.textContent = '跟随酒馆规则';
    status.dataset.state = 'idle';
  }
}

function toggleWorldBookEntryExclusion(bookName, uid, excluded) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  const bookKey = String(bookName || '').trim();
  const uidKey = String(uid ?? '').trim();
  if (!bookKey || !uidKey) return;
  const excludedMap = settings.worldInfo.excluded;
  const uids = new Set(Array.isArray(excludedMap[bookKey]) ? excludedMap[bookKey] : []);
  if (excluded) uids.add(uidKey);
  else uids.delete(uidKey);
  if (uids.size > 0) excludedMap[bookKey] = Array.from(uids);
  else delete excludedMap[bookKey];
  saveSettings(ctx);
  refreshHomeWorldBookStatus();
  // 原地更新该条目行与状态栏：不重建列表，避免滚动位置跳回顶部。
  updateWorldBookRowState(bookKey, uidKey, excluded);
}

function getWorldBookExcludedTotal(settings) {
  const excluded = settings?.worldInfo?.excluded;
  if (!excluded || typeof excluded !== 'object') return 0;
  return Object.values(excluded).reduce((sum, uids) => sum + (Array.isArray(uids) ? uids.length : 0), 0);
}

// 排除勾选后原地刷新条目行与状态栏（行可能被搜索过滤隐藏，找不到行时只更新状态栏）。
function updateWorldBookRowState(bookKey, uidKey, excluded) {
  const row = worldBookRowsByKey.get(worldInfoEntryKey(bookKey, uidKey));
  if (row) {
    row.classList.toggle('is-excluded', excluded);
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = excluded;
    const badges = row.querySelector('.soullink-worldbook__entry-badges');
    const existingBadge = row.querySelector('.soullink-worldbook__badge.is-excluded');
    if (excluded) {
      if (!existingBadge && badges) badges.appendChild(buildWorldBookBadge('已排除', 'is-excluded'));
    } else if (existingBadge) {
      existingBadge.remove();
    }
  }
  const ctx = getContextSafe();
  const settings = ctx ? getSettings(ctx) : null;
  const excludedTotal = settings ? getWorldBookExcludedTotal(settings) : 0;
  const status = document.getElementById(WORLDBOOK_STATUS_ID);
  const summary = worldBookLastSummary;
  if (status && summary) {
    status.textContent = `${getWorldBookModeText(summary.mode)} · ${summary.bookCount} 本书 · ${excludedTotal} 条排除`;
    status.dataset.state = summary.mode === 'none' ? 'error' : (excludedTotal > 0 ? 'ok' : 'idle');
  }
  const clearButton = document.getElementById(WORLDBOOK_CLEAR_ID);
  if (clearButton) clearButton.hidden = excludedTotal === 0;
}

function clearWorldBookExclusions() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.worldInfo.excluded = {};
  saveSettings(ctx);
  refreshHomeWorldBookStatus();
  renderWorldBookList();
}

function buildWorldBookBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `soullink-worldbook__badge ${className}`;
  badge.textContent = text;
  return badge;
}

// 渲染序号：排除勾选/刷新会触发多次并发 render，只允许最新一次写 DOM，
// 避免交错渲染导致列表重复。
let worldBookRenderSeq = 0;

// 已渲染条目行引用（书名 + uid → 行节点）：排除勾选时原地更新该行，
// 不重建整个列表，保持当前滚动位置与搜索过滤状态。
const worldBookRowsByKey = new Map();

// 最近一次渲染的世界书概要：排除勾选后原地刷新状态栏，无需重新跑引擎。
let worldBookLastSummary = null;

// 每本书的搜索词：渲染会整体重建 DOM，搜索词单独保存，排除勾选/刷新后不丢。
const worldBookSearchQueries = new Map();

// 每本书的折叠状态：渲染会整体重建 DOM，折叠状态单独保存，刷新后不丢。
const worldBookCollapsedBooks = new Set();

// 条目显示排序：常驻 → 本次触发 → 未触发（可触发）→ 禁用（根本不会被激活）。
// 与酒馆编辑器的 priority 排序（常驻→普通→禁用）一致，普通档内再按「本次触发」优先；
// 禁用条目即使标了常驻也排最后——酒馆扫描时 disable 检查先于 constant，禁用条目永远不会激活。
function getWorldBookEntryRank(entry, triggered) {
  if (entry.disabled) return 3;
  if (entry.constant) return 0;
  if (triggered) return 1;
  return 2;
}

// 在书区块内按条目名称过滤行：只隐藏 DOM，不重跑酒馆引擎，也不丢搜索框焦点。
function applyWorldBookSearch(section, query) {
  const q = String(query || '').trim().toLowerCase();
  const rows = section.querySelectorAll('.soullink-worldbook__entry');
  const count = section.querySelector('.soullink-worldbook__book-count');
  let matched = 0;
  for (const row of rows) {
    const hit = !q || String(row.dataset.search || '').includes(q);
    row.hidden = !hit;
    if (hit) matched += 1;
  }
  if (count && rows.length > 0) {
    count.textContent = q ? `${matched} / ${rows.length} 条` : `${rows.length} 条`;
  }
}

async function renderWorldBookList() {
  const seq = ++worldBookRenderSeq;
  const list = document.getElementById(WORLDBOOK_LIST_ID);
  if (!list) return;
  worldBookRowsByKey.clear();
  worldBookLastSummary = null;
  const status = document.getElementById(WORLDBOOK_STATUS_ID);
  const chatNode = document.getElementById(WORLDBOOK_CHAT_ID);
  const banner = document.getElementById(WORLDBOOK_BANNER_ID);
  const clearButton = document.getElementById(WORLDBOOK_CLEAR_ID);
  const ctx = getContextSafe();
  if (!ctx) {
    if (status) {
      status.textContent = '宿主上下文不可用';
      status.dataset.state = 'error';
    }
    list.textContent = '';
    return;
  }
  if (chatNode) chatNode.textContent = `当前聊天：${getCurrentChatLabel(ctx)}`;
  if (status) {
    status.textContent = '读取中…';
    status.dataset.state = 'busy';
  }
  const settings = getSettings(ctx);
  const result = await getStWorldInfoActivation(ctx);
  if (seq !== worldBookRenderSeq) return;
  const mode = !result ? 'none' : (Array.isArray(result?.worldInfoActivation?.entries) ? 'entries' : 'strings');
  const excludedKeys = getWorldInfoExcludedKeys(settings);
  const triggeredKeys = new Set();
  if (mode === 'entries') {
    for (const entry of result.worldInfoActivation.entries) {
      triggeredKeys.add(worldInfoEntryKey(entry?.world, entry?.uid));
    }
  }
  const bookNames = await getActiveWorldBookNames(ctx, result);
  if (seq !== worldBookRenderSeq) return;
  const excludedTotal = excludedKeys.size;
  worldBookLastSummary = { mode, bookCount: bookNames.size, excludedTotal };
  if (status) {
    status.textContent = `${getWorldBookModeText(mode)} · ${bookNames.size} 本书 · ${excludedTotal} 条排除`;
    status.dataset.state = mode === 'none' ? 'error' : (excludedTotal > 0 ? 'ok' : 'idle');
  }
  if (clearButton) clearButton.hidden = excludedTotal === 0;
  if (banner) {
    if (mode === 'strings') {
      banner.hidden = false;
      banner.textContent = '当前宿主未提供条目级激活数据：世界书将按 SillyTavern 原文整体注入（无法按条目排除），下方列表仅供查看。';
    } else if (mode === 'none') {
      banner.hidden = false;
      banner.textContent = (typeof ctx.getWorldInfoPrompt === 'function')
        ? '世界书引擎调用失败（见后台日志）：本次档案分析不会注入世界书内容。'
        : '宿主未提供世界书引擎（getWorldInfoPrompt）：本次档案分析不会注入世界书内容。';
    } else {
      banner.hidden = true;
      banner.textContent = '';
    }
  }
  list.textContent = '';
  if (bookNames.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-worldbook__empty';
    empty.textContent = mode === 'none'
      ? '当前没有可读取的世界书。'
      : '当前聊天没有激活任何世界书（角色 / 全局 / 聊天均未绑定）。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const bookName of Array.from(bookNames).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))) {
    const entries = await loadWorldBookEntries(ctx, bookName);
    if (seq !== worldBookRenderSeq) return;
    const section = document.createElement('div');
    section.className = 'soullink-worldbook__book';
    const head = document.createElement('div');
    head.className = 'soullink-worldbook__book-head';
    const title = document.createElement('span');
    title.className = 'soullink-worldbook__book-name';
    title.textContent = bookName;
    const count = document.createElement('span');
    count.className = 'soullink-worldbook__book-count';
    count.textContent = `${entries.length} 条`;
    const collapse = document.createElement('button');
    collapse.type = 'button';
    collapse.className = 'soullink-worldbook__collapse';
    collapse.title = '折叠 / 展开本书';
    collapse.setAttribute('aria-expanded', 'true');
    collapse.textContent = '▾';
    head.append(title, count, collapse);
    section.appendChild(head);
    const body = document.createElement('div');
    body.className = 'soullink-worldbook__book-body';
    section.appendChild(body);
    const collapsed = worldBookCollapsedBooks.has(bookName);
    if (collapsed) {
      section.classList.add('is-collapsed');
      collapse.textContent = '▸';
      collapse.setAttribute('aria-expanded', 'false');
      body.hidden = true;
    }
    collapse.addEventListener('click', () => {
      const nowCollapsed = section.classList.toggle('is-collapsed');
      collapse.textContent = nowCollapsed ? '▸' : '▾';
      collapse.setAttribute('aria-expanded', String(!nowCollapsed));
      body.hidden = nowCollapsed;
      if (nowCollapsed) worldBookCollapsedBooks.add(bookName);
      else worldBookCollapsedBooks.delete(bookName);
    });
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'soullink-worldbook__book-empty';
      empty.textContent = '（无法读取该书的条目）';
      body.appendChild(empty);
      fragment.appendChild(section);
      continue;
    }
    entries.sort((a, b) => {
      const rankA = getWorldBookEntryRank(a, triggeredKeys.has(worldInfoEntryKey(a.world, a.uid)));
      const rankB = getWorldBookEntryRank(b, triggeredKeys.has(worldInfoEntryKey(b.world, b.uid)));
      return rankA - rankB;
    });
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'soullink-worldbook__search';
    searchInput.placeholder = '搜索条目名称…';
    searchInput.value = worldBookSearchQueries.get(bookName) || '';
    searchInput.addEventListener('input', () => {
      const query = searchInput.value;
      if (query) worldBookSearchQueries.set(bookName, query);
      else worldBookSearchQueries.delete(bookName);
      applyWorldBookSearch(section, query);
    });
    body.appendChild(searchInput);
    for (const entry of entries) {
      const key = worldInfoEntryKey(entry.world, entry.uid);
      const excluded = excludedKeys.has(key);
      const triggered = triggeredKeys.has(key);
      const row = document.createElement('label');
      row.className = 'soullink-worldbook__entry';
      row.dataset.search = String(entry.displayName || `条目 ${entry.uid}`).toLowerCase();
      worldBookRowsByKey.set(worldInfoEntryKey(entry.world, entry.uid), row);
      if (excluded) row.classList.add('is-excluded');
      if (triggered) row.classList.add('is-triggered');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = excluded;
      checkbox.disabled = mode !== 'entries';
      checkbox.title = mode === 'entries'
        ? '排除后，该条目即使被 SillyTavern 触发也不会注入档案分析提示词'
        : '当前宿主不支持按条目排除';
      checkbox.addEventListener('change', () => {
        toggleWorldBookEntryExclusion(entry.world, entry.uid, checkbox.checked);
      });
      const textWrap = document.createElement('span');
      textWrap.className = 'soullink-worldbook__entry-main';
      const name = document.createElement('span');
      name.className = 'soullink-worldbook__entry-name';
      name.textContent = entry.displayName || `条目 ${entry.uid}`;
      name.title = entry.content || entry.displayName || '';
      const badges = document.createElement('span');
      badges.className = 'soullink-worldbook__entry-badges';
      if (entry.constant) badges.appendChild(buildWorldBookBadge('常驻', 'is-constant'));
      if (entry.disabled) badges.appendChild(buildWorldBookBadge('禁用', 'is-disabled'));
      badges.appendChild(buildWorldBookBadge(getWorldInfoPositionLabel(entry.position), 'is-position'));
      if (triggered) badges.appendChild(buildWorldBookBadge('本次触发', 'is-triggered'));
      if (excluded) badges.appendChild(buildWorldBookBadge('已排除', 'is-excluded'));
      textWrap.append(name, badges);
      row.append(checkbox, textWrap);
      body.appendChild(row);
    }
    applyWorldBookSearch(section, worldBookSearchQueries.get(bookName) || '');
    fragment.appendChild(section);
  }
  // 清理已不在当前激活列表里的书的搜索词与折叠状态。
  for (const key of Array.from(worldBookSearchQueries.keys())) {
    if (!bookNames.has(key)) worldBookSearchQueries.delete(key);
  }
  for (const key of Array.from(worldBookCollapsedBooks)) {
    if (!bookNames.has(key)) worldBookCollapsedBooks.delete(key);
  }
  list.appendChild(fragment);
}

function initWorldBookSection(panel) {
  if (!panel || panel.dataset.worldbookReady === 'true') return;
  document.getElementById(WORLDBOOK_REFRESH_ID)?.addEventListener('click', renderWorldBookList);
  document.getElementById(WORLDBOOK_CLEAR_ID)?.addEventListener('click', clearWorldBookExclusions);
  refreshHomeWorldBookStatus();
  panel.dataset.worldbookReady = 'true';
  logApp('info', '世界书系统已就绪');
}
