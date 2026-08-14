// ---------- 档案系统：视图 UI ----------
function formatArchiveTime(timestamp) {
  if (!timestamp) return '尚未分析';
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function findArchiveCard(name) {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return null;
  for (const card of list.querySelectorAll('.soullink-archive__card')) {
    if (card.dataset.name === name) return card;
  }
  return null;
}

function renderArchiveCard(name) {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return;
  const archive = getArchiveForRender(name);
  if (!archive) {
    findArchiveCard(name)?.remove();
    return;
  }
  const built = buildArchiveCard(name, archive);
  const existing = findArchiveCard(name);
  if (existing) existing.replaceWith(built);
  else list.appendChild(built);
}

function buildArchiveCard(name, archive) {
  const card = document.createElement('div');
  card.className = 'soullink-archive__card';
  card.dataset.name = name;

  const head = document.createElement('div');
  head.className = 'soullink-archive__card-head';
  const nameNode = document.createElement('span');
  nameNode.className = 'soullink-archive__card-name';
  nameNode.textContent = name;

  const analyzeState = archiveAnalysisState[name] || { state: 'idle', message: '' };
  const refineState = archiveRefineState[name] || { state: 'idle', message: '' };
  // 状态胶囊：精编与分析共用，精编状态优先（精编是最近一次主动操作）
  const refinePriority = ['busy', 'error', 'ok'].includes(refineState.state);
  const statusState = refinePriority ? refineState : analyzeState;
  const statusKind = refinePriority ? '精编' : '分析';
  const status = document.createElement(statusState.state === 'error' ? 'button' : 'span');
  status.type = 'button';
  status.className = 'soullink-archive__status';
  status.dataset.state = statusState.state;
  status.textContent = statusState.message || '待分析';
  if (statusState.state === 'error') {
    status.classList.add('is-clickable');
    status.title = `点击查看${statusKind}失败详情（AI 回复原文）`;
    status.addEventListener('click', () => showArchiveAnalysisError(name, statusState, statusKind));
  }

  const analyzeBtn = document.createElement('button');
  analyzeBtn.type = 'button';
  analyzeBtn.className = 'soullink-archive__analyze';
  const busy = analyzeState.state === 'busy';
  analyzeBtn.classList.toggle('is-cancelling', busy);
  analyzeBtn.textContent = busy ? '⏹ 取消分析角色' : '🔮 分析本角色';
  analyzeBtn.title = busy ? '点击中断该角色的分析请求' : '用最近对话配合「档案系统」提示词更新该角色档案';
  analyzeBtn.addEventListener('click', () => {
    if (archiveAnalysisState[name]?.state === 'busy') cancelCharacterAnalysis(name);
    else analyzeCharacter(name);
  });

  const refineBtn = document.createElement('button');
  refineBtn.type = 'button';
  refineBtn.className = 'soullink-archive__refine';
  if (refineState.state === 'busy') {
    refineBtn.classList.add('is-cancelling');
    refineBtn.textContent = '⏹ 取消精编';
    refineBtn.title = '点击中断该角色的精编请求';
    refineBtn.addEventListener('click', () => cancelRefineCharacter(name));
  } else {
    refineBtn.textContent = '✨ 精编';
    refineBtn.title = '用「档案精编」提示词整理该角色档案：规范格式、合并重复、提炼浓缩';
    refineBtn.addEventListener('click', () => refineCharacter(name));
  }

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'soullink-archive__edit';
  editBtn.textContent = archiveEditState[name] ? '✏️ 编辑中' : '✏️ 编辑';
  editBtn.addEventListener('click', () => toggleArchiveEdit(name));

  const collapsed = !!archiveCollapsedState[name];
  card.classList.toggle('is-collapsed', collapsed);

  const collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.className = 'soullink-archive__collapse';
  collapseBtn.textContent = collapsed ? '▾' : '▴';
  collapseBtn.title = collapsed ? '展开卡片' : '折叠卡片，只显示名字';
  collapseBtn.addEventListener('click', () => toggleArchiveCollapse(name));

  const actions = document.createElement('div');
  actions.className = 'soullink-archive__card-actions';
  actions.append(analyzeBtn, refineBtn, editBtn);

  head.append(nameNode, status, collapseBtn, actions);
  card.appendChild(head);
  card.appendChild(archiveEditState[name]
    ? buildArchiveEditBody(name, archive)
    : buildArchiveDisplayBody(archive));
  return card;
}

function buildArchiveDisplayBody(archive) {
  const body = document.createElement('div');
  body.className = 'soullink-archive__body';

  const fields = document.createElement('div');
  fields.className = 'soullink-archive__fields';
  for (const key of ARCHIVE_SCALAR_FIELDS) {
    const field = document.createElement('div');
    field.className = 'soullink-archive__field';
    const label = document.createElement('span');
    label.className = 'soullink-archive__field-label';
    label.textContent = ARCHIVE_SCALAR_LABELS[key];
    const value = document.createElement('span');
    value.className = 'soullink-archive__field-value';
    value.textContent = String(archive.fields[key] || '');
    if (!value.textContent) value.classList.add('is-empty');
    field.append(label, value);
    fields.appendChild(field);
  }
  body.appendChild(fields);

  for (const section of ARCHIVE_SECTIONS) {
    const block = document.createElement('div');
    block.className = 'soullink-archive__section';
    const title = document.createElement('div');
    title.className = 'soullink-archive__section-title';
    title.textContent = section.label;
    block.appendChild(title);
    const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'soullink-archive__section-empty';
      empty.textContent = '（暂无）';
      block.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'soullink-archive__section-items';
      for (const item of items) {
        const li = document.createElement('li');
        li.className = 'soullink-archive__section-item';
        li.textContent = String(item.content || '');
        list.appendChild(li);
      }
      block.appendChild(list);
    }
    body.appendChild(block);
  }

  const meta = document.createElement('div');
  meta.className = 'soullink-archive__meta';
  meta.textContent = `最后更新：${formatArchiveTime(archive.updatedAt)}`;
  body.appendChild(meta);
  return body;
}

function buildArchiveEditBody(name, archive) {
  const body = document.createElement('div');
  body.className = 'soullink-archive__body';

  const fields = document.createElement('div');
  fields.className = 'soullink-archive__fields';
  for (const key of ARCHIVE_SCALAR_FIELDS) {
    const field = document.createElement('label');
    field.className = 'soullink-archive__field soullink-archive__field--edit';
    const label = document.createElement('span');
    label.className = 'soullink-archive__field-label';
    label.textContent = ARCHIVE_SCALAR_LABELS[key];
    const input = document.createElement('input');
    input.className = 'soullink-input';
    input.type = 'text';
    input.value = String(archive.fields[key] || '');
    input.dataset.fieldKey = key;
    input.placeholder = `填写${ARCHIVE_SCALAR_LABELS[key]}…`;
    field.append(label, input);
    fields.appendChild(field);
  }
  body.appendChild(fields);

  for (const section of ARCHIVE_SECTIONS) {
    const block = document.createElement('div');
    block.className = 'soullink-archive__section';
    const title = document.createElement('div');
    title.className = 'soullink-archive__section-title';
    title.textContent = section.label;
    const textarea = document.createElement('textarea');
    textarea.className = 'soullink-input soullink-archive__section-edit';
    textarea.dataset.sectionKey = section.key;
    textarea.placeholder = section.hint;
    const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
    textarea.value = items.map((item) => item.content).join('\n');
    block.append(title, textarea);
    body.appendChild(block);
  }

  const actions = document.createElement('div');
  actions.className = 'soullink-archive__edit-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'soullink-btn soullink-btn--ghost';
  cancel.textContent = '取消';
  cancel.addEventListener('click', () => {
    delete archiveEditState[name];
    renderArchiveCard(name);
  });
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'soullink-btn';
  save.textContent = '💾 保存修改';
  save.addEventListener('click', () => saveArchiveEdit(name, body));
  actions.append(cancel, save);
  body.appendChild(actions);
  return body;
}

function toggleArchiveEdit(name) {
  if (!getArchiveForRender(name)) return;
  if (archiveEditState[name]) delete archiveEditState[name];
  else archiveEditState[name] = true;
  renderArchiveCard(name);
}

function toggleArchiveCollapse(name) {
  if (archiveCollapsedState[name]) delete archiveCollapsedState[name];
  else archiveCollapsedState[name] = true;
  renderArchiveCard(name);
}

function saveArchiveEdit(name, body) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : null;
  const archive = roster?.[name];
  if (!roster || !archive) return;
  body.querySelectorAll('input[data-field-key]').forEach((input) => {
    const key = input.dataset.fieldKey;
    if (ARCHIVE_SCALAR_FIELDS.includes(key)) archive.fields[key] = input.value.trim();
  });
  body.querySelectorAll('textarea[data-section-key]').forEach((textarea) => {
    const key = textarea.dataset.sectionKey;
    if (ARCHIVE_SECTION_KEYS.includes(key)) {
      archive[key] = rebuildSectionItems(archive[key], textarea.value);
    }
  });
  archive.updatedAt = Date.now();
  delete archiveEditState[name];
  saveSettingsImmediate(ctx);
  logApp('info', '档案已手动修改', name);
  globalThis.toastr?.success?.(`「${name}」档案已保存`, `[${MODULE_NAME}]`);
  renderArchiveCard(name);
  refreshHomeStatuses();
}

function rebuildSectionItems(items, text) {
  const source = Array.isArray(items) ? items : [];
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const used = new Set();
  const next = [];
  for (const line of lines) {
    let matched = null;
    for (let i = 0; i < source.length; i += 1) {
      if (used.has(i)) continue;
      if (String(source[i].content || '') === line) {
        matched = source[i];
        used.add(i);
        break;
      }
    }
    if (matched) next.push(matched);
    else next.push({ id: nextSectionItemId(null, next), content: line });
  }
  return next;
}

function nextSectionItemId(section, items) {
  let max = 0;
  for (const item of items) {
    const match = String(item.id || '').match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${section ? section.prefix : 'i'}${max + 1}`;
}

function renderArchiveList() {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return;
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {}).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const status = document.getElementById(ARCHIVE_STATUS_ID);
  if (status) status.textContent = `${names.length} 个档案`;
  renderAnalyzeAllButton();
  renderRefineAllButton();
  list.textContent = '';
  if (names.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-archive__empty';
    empty.textContent = '名单还是空的 —— 先去「角色注册」注册角色吧。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const name of names) fragment.appendChild(buildArchiveCard(name, roster[name]));
  list.appendChild(fragment);
}

function isAnyAnalysisBusy() {
  return Object.values(archiveAnalysisState).some((state) => state?.state === 'busy');
}

function renderAnalyzeAllButton() {
  const button = document.getElementById(ARCHIVE_ANALYZE_ALL_ID);
  if (!button) return;
  button.textContent = isAnyAnalysisBusy() ? '⏹ 取消分析全部角色' : '🔮 分析全部角色';
}

function isAnyRefineBusy() {
  return Object.values(archiveRefineState).some((state) => state?.state === 'busy');
}

function renderRefineAllButton() {
  const button = document.getElementById(ARCHIVE_REFINE_ALL_ID);
  if (!button) return;
  button.textContent = isAnyRefineBusy() ? '⏹ 取消精编全部档案' : '✨ 精编全部档案';
}

function cancelCharacterAnalysis(name) {
  const state = archiveAnalysisState[name];
  if (!state || state.state !== 'busy') return;
  try {
    state.controller?.abort?.();
  } catch {}
  archiveAnalysisState[name] = { state: 'cancelled', message: '已取消' };
  renderArchiveCard(name);
  renderAnalyzeAllButton();
  refreshHomeStatuses();
  logApp('info', '取消角色分析', name);
}

function cancelRefineCharacter(name) {
  const state = archiveRefineState[name];
  if (!state || state.state !== 'busy') return;
  try {
    state.controller?.abort?.();
  } catch {}
  archiveRefineState[name] = { state: 'cancelled', message: '已取消' };
  renderArchiveCard(name);
  renderRefineAllButton();
  refreshHomeStatuses();
  logApp('info', '取消角色精编', name);
  globalThis.toastr?.info?.(`已取消「${name}」精编`, `[${MODULE_NAME}]`);
}

function showArchiveAnalysisError(name, state, kind = '分析') {
  const panel = getPanel();
  if (!panel) return;
  const detail = state?.detail || {};
  const rawContent = String(detail.rawContent ?? '');
  const errorMessage = String(detail.errorMessage ?? '');
  let overlay = panel.querySelector('.soullink-archive-error');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'soullink-archive-error';
    overlay.innerHTML = `
      <div class="soullink-archive-error__card" role="dialog" aria-modal="true" aria-label="${kind}失败详情">
        <div class="soullink-archive-error__head">
          <span class="soullink-archive-error__title"></span>
          <button type="button" class="soullink-archive-error__close" aria-label="关闭" title="关闭">✕</button>
        </div>
        <p class="soullink-archive-error__hint"></p>
        <p class="soullink-archive-error__label">AI 回复原文：</p>
        <pre class="soullink-archive-error__content"></pre>
        <div class="soullink-archive-error__actions">
          <button type="button" class="soullink-btn soullink-archive-error__copy">📋 一键复制</button>
          <button type="button" class="soullink-btn soullink-archive-error__close-btn">关闭</button>
        </div>
      </div>
    `;
    overlay.querySelector('.soullink-archive-error__close')?.addEventListener('click', () => overlay.classList.remove('is-open'));
    overlay.querySelector('.soullink-archive-error__close-btn')?.addEventListener('click', () => overlay.classList.remove('is-open'));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay.classList.remove('is-open');
    });
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') overlay.classList.remove('is-open');
    });
    overlay.querySelector('.soullink-archive-error__copy')?.addEventListener('click', async (event) => {
      const text = String(event.currentTarget?.dataset?.copyText ?? '').trim();
      if (!text) return;
      try {
        if (globalThis.navigator?.clipboard?.writeText) {
          await globalThis.navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand?.('copy');
          textarea.remove();
        }
        globalThis.toastr?.success?.('已复制失败详情 AI 回复原文', `[${MODULE_NAME}]`);
      } catch (error) {
        globalThis.toastr?.error?.(`失败详情原文复制失败：${error?.message || error}`, `[${MODULE_NAME}]`);
      }
    });
    panel.appendChild(overlay);
  }
  overlay.querySelector('.soullink-archive-error__title').textContent = `「${name}」${kind}失败`;
  overlay.querySelector('.soullink-archive-error__hint').textContent = errorMessage
    ? `错误信息：${errorMessage}`
    : '（本次失败未捕获到错误信息）';
  const contentNode = overlay.querySelector('.soullink-archive-error__content');
  const copyBtn = overlay.querySelector('.soullink-archive-error__copy');
  const trimmed = rawContent.trim();
  if (trimmed) {
    contentNode.textContent = rawContent;
    copyBtn.dataset.copyText = rawContent;
    copyBtn.disabled = false;
  } else {
    contentNode.textContent = '（本次失败发生在 API 请求阶段，未收到 AI 回复内容）';
    copyBtn.dataset.copyText = '';
    copyBtn.disabled = true;
  }
  overlay.classList.add('is-open');
  (copyBtn.disabled ? overlay.querySelector('.soullink-archive-error__close-btn') : copyBtn)?.focus?.();
}

// 批量执行角色分析：并发执行全部角色。v1.0.3 曾对 DeepSeek 官方地址改为串行，
// 以规避「并发下 200 + 空内容」——v1.0.5 定位到真实根因是模型把答案写进
// reasoning_content（content 留空），与并发无关，串行机制已移除，恢复统一并发。
// 取消语义不变：每个角色仍持有自己的 AbortController，取消按钮照常中断在途请求。
async function runArchiveAnalysisBatch(names) {
  return Promise.allSettled(names.map((name) => analyzeCharacter(name)));
}

// 批量执行角色精编：并发执行全部角色，每个角色独立 AbortController，取消语义与批量分析一致。
async function runRefineBatch(names) {
  return Promise.allSettled(names.map((name) => refineCharacter(name)));
}

async function analyzeAllCharacters() {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {});
  if (names.length === 0) {
    globalThis.toastr?.warning?.('档案分析：名单里还没有角色', `[${MODULE_NAME}]`);
    return;
  }
  if (isAnyAnalysisBusy()) {
    // 「取消分析全部角色」：中断所有在途的角色分析
    for (const name of names) cancelCharacterAnalysis(name);
    logApp('info', '取消全部角色分析');
    globalThis.toastr?.info?.('已取消全部角色的档案分析', `[${MODULE_NAME}]`);
    return;
  }
  const results = await runArchiveAnalysisBatch(names);
  const counts = { ok: 0, error: 0, cancelled: 0, skipped: 0, busy: 0 };
  for (const result of results) {
    const outcome = result.status === 'fulfilled' ? String(result.value || 'ok') : 'error';
    counts[outcome] = (counts[outcome] || 0) + 1;
  }
  const parts = [];
  if (counts.ok > 0) parts.push(`${counts.ok} 成功`);
  if (counts.error > 0) parts.push(`${counts.error} 失败`);
  if (counts.cancelled > 0) parts.push(`${counts.cancelled} 取消`);
  if (counts.busy > 0) parts.push(`${counts.busy} 进行中`);
  logApp('info', '全部角色分析结束', parts.join('，') || '无角色可分析');
  if (counts.error > 0) {
    globalThis.toastr?.warning?.(`档案分析完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else if (counts.cancelled > 0 && counts.ok === 0) {
    globalThis.toastr?.info?.(`档案分析已取消：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else {
    globalThis.toastr?.success?.(`档案分析完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  }
  renderAnalyzeAllButton();
}

async function refineAllCharacters() {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {});
  if (names.length === 0) {
    globalThis.toastr?.warning?.('档案精编：名单里还没有角色', `[${MODULE_NAME}]`);
    return;
  }
  if (isAnyRefineBusy()) {
    // 「取消精编全部档案」：中断所有在途的角色精编
    for (const name of names) cancelRefineCharacter(name);
    logApp('info', '取消全部角色精编');
    globalThis.toastr?.info?.('已取消全部角色的档案精编', `[${MODULE_NAME}]`);
    return;
  }
  const results = await runRefineBatch(names);
  const counts = { ok: 0, error: 0, cancelled: 0, skipped: 0, busy: 0 };
  for (const result of results) {
    const outcome = result.status === 'fulfilled' ? String(result.value || 'ok') : 'error';
    counts[outcome] = (counts[outcome] || 0) + 1;
  }
  const parts = [];
  if (counts.ok > 0) parts.push(`${counts.ok} 成功`);
  if (counts.error > 0) parts.push(`${counts.error} 失败`);
  if (counts.cancelled > 0) parts.push(`${counts.cancelled} 取消`);
  if (counts.skipped > 0) parts.push(`${counts.skipped} 跳过`);
  if (counts.busy > 0) parts.push(`${counts.busy} 进行中`);
  logApp('info', '全部角色精编结束', parts.join('，') || '无角色可精编');
  if (counts.error > 0) {
    globalThis.toastr?.warning?.(`档案精编完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else if (counts.cancelled > 0 && counts.ok === 0) {
    globalThis.toastr?.info?.(`档案精编已取消：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else if (counts.ok === 0 && counts.skipped > 0) {
    globalThis.toastr?.info?.(`档案精编完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else {
    globalThis.toastr?.success?.(`档案精编完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  }
  renderRefineAllButton();
}

function renderAutoArchiveToggle() {
  const button = document.getElementById(AUTO_ARCHIVE_TOGGLE_ID);
  if (!button) return;
  const ctx = getContextSafe();
  const enabled = ctx ? getSettings(ctx).autoArchiveEnabled !== false : true;
  button.classList.toggle('is-on', enabled);
  button.setAttribute('aria-checked', String(enabled));
  button.title = enabled ? '点击关闭自动档案维护' : '点击开启自动档案维护';
}

function toggleAutoArchive() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.autoArchiveEnabled = !settings.autoArchiveEnabled;
  saveSettingsImmediate(ctx);
  renderAutoArchiveToggle();
  logApp('info', settings.autoArchiveEnabled ? '自动档案维护已开启' : '自动档案维护已关闭');
  globalThis.toastr?.info?.(`自动档案维护已${settings.autoArchiveEnabled ? '开启' : '关闭'}`, `[${MODULE_NAME}]`);
}

function initArchiveSection(panel) {
  if (!panel || panel.dataset.archiveReady === 'true') return;
  document.getElementById(ARCHIVE_ANALYZE_ALL_ID)?.addEventListener('click', analyzeAllCharacters);
  document.getElementById(ARCHIVE_REFINE_ALL_ID)?.addEventListener('click', refineAllCharacters);
  document.getElementById(AUTO_ARCHIVE_TOGGLE_ID)?.addEventListener('click', toggleAutoArchive);
  renderAutoArchiveToggle();
  renderAnalyzeAllButton();
  renderRefineAllButton();
  renderArchiveList();
  panel.dataset.archiveReady = 'true';
  logApp('info', '档案系统已就绪');
}
