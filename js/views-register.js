// ---------- 注册系统与档案系统：数据模型 ----------
const archiveAnalysisState = {}; // 角色名 -> { state: 'idle'|'busy'|'ok'|'error', message, detail }
const archiveEditState = {};     // 角色名 -> true（处于编辑态）

function getCurrentChatKey(ctx) {
  if (!ctx) return ARCHIVE_DEFAULT_KEY;
  if (ctx.chatId) return String(ctx.chatId);
  const characterId = ctx.characterId !== undefined && ctx.characterId !== null ? String(ctx.characterId) : 'npc';
  const groupId = ctx.groupId !== undefined && ctx.groupId !== null ? String(ctx.groupId) : '';
  return groupId ? `g${groupId}` : characterId;
}

function getCurrentChatLabel(ctx) {
  if (!ctx) return '未绑定聊天';
  return String(ctx.chatTitle || getCurrentChatKey(ctx));
}

function getArchiveStore(ctx) {
  const settings = ctx ? getSettings(ctx) : null;
  if (!settings) return null;
  const chatKey = getCurrentChatKey(ctx);
  if (!settings.archives[chatKey] || typeof settings.archives[chatKey] !== 'object' || Array.isArray(settings.archives[chatKey])) {
    settings.archives[chatKey] = {};
  }
  return settings.archives[chatKey];
}

function getRoster(ctx) {
  return getArchiveStore(ctx);
}

function getArchiveForRender(name) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  return roster?.[name] || null;
}

function createEmptyArchive(name) {
  return {
    fields: { name: String(name || ''), age: '', gender: '', occupation: '' },
    personality: [],
    worldview: [],
    family: [],
    relationships: [],
    memory: [],
    updatedAt: 0,
  };
}

// ---------- 删楼联动档案清理：楼层溯源 ----------
// 每次档案分析写入新条目时，给条目打上「来源楼层」标记（分析时聊天末条消息的签名）。
// 玩家删除楼层后，程序在 messageDeleted / chatChanged / groupSelected / DOM 观察
// 里对比该聊天的消息签名快照，把来源楼层已不存在的档案条目一并清除，
// 避免档案保留已被删掉的剧情信息。旧数据（条目没有 source 字段）不受影响，
// 手动编辑新增的条目同样不带 source、不会被自动清理；标量字段不做回滚。
// 只有「楼层数减少」才视为删楼：其他扩展原地改写消息内容（如智绘姬把生图提示词
// 插回最新楼层）不会减少楼层数，签名变化只更新快照、不触发清理。
const floorTraceSnapshots = new Map(); // chatKey -> Set<消息签名>
const floorTraceLastLengths = new Map(); // chatKey -> 上次快照时的楼层数

function getCurrentFloorSignature(ctx) {
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const lastMessage = chat[chat.length - 1];
  return lastMessage ? buildAutoArchiveSignature(lastMessage) : '';
}

function getChatSignatureSet(ctx) {
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const signatures = new Set();
  for (const message of chat) {
    const signature = buildAutoArchiveSignature(message);
    if (signature) signatures.add(signature);
  }
  return signatures;
}

function purgeArchiveEntriesForDeletedFloors(ctx, deletedSignatures) {
  if (!deletedSignatures || deletedSignatures.size === 0) return 0;
  const roster = ctx ? getRoster(ctx) : null;
  if (!roster) return 0;
  let removed = 0;
  const byCharacter = {};
  for (const name of Object.keys(roster)) {
    const archive = roster[name];
    if (!archive || typeof archive !== 'object') continue;
    for (const section of ARCHIVE_SECTIONS) {
      const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
      if (items.length === 0) continue;
      const kept = items.filter((item) => {
        if (!item || typeof item !== 'object' || !item.source) return true;
        return !deletedSignatures.has(String(item.source));
      });
      if (kept.length !== items.length) {
        const count = items.length - kept.length;
        removed += count;
        byCharacter[name] = (byCharacter[name] || 0) + count;
        archive[section.key] = kept;
      }
    }
  }
  if (removed > 0) {
    saveSettingsImmediate(ctx);
    logApp('info', '删楼联动档案清理', `楼层已删除，同步清理档案 ${removed} 条`, byCharacter);
    globalThis.toastr?.info?.(`已删除楼层对应的档案条目已清理（${removed} 条）`, `[${MODULE_NAME}]`);
    renderArchiveList();
    refreshHomeStatuses();
  }
  return removed;
}

function rebuildFloorTraceSnapshot(ctx) {
  if (!ctx) return;
  floorTraceLastChatKey = getCurrentChatKey(ctx);
  floorTraceSnapshots.set(floorTraceLastChatKey, getChatSignatureSet(ctx));
  floorTraceLastLengths.set(floorTraceLastChatKey, Array.isArray(ctx.chat) ? ctx.chat.length : 0);
  floorTraceLastChat = Array.isArray(ctx.chat) ? ctx.chat.slice() : [];
}

// 对比快照与当前聊天：返回已消失楼层的签名集合，并顺手把快照重建为当前状态。
// 楼层数没有减少（内容编辑 / 重渲染 / 新增楼层）一律不算删楼，避免误清理。
function diffFloorTraceSnapshot(ctx) {
  const chatKey = getCurrentChatKey(ctx);
  const previous = floorTraceSnapshots.get(chatKey);
  const previousLength = floorTraceLastLengths.get(chatKey) ?? 0;
  const current = getChatSignatureSet(ctx);
  const currentLength = Array.isArray(ctx.chat) ? ctx.chat.length : 0;
  rebuildFloorTraceSnapshot(ctx);
  if (!previous || previous.size === 0) return new Set();
  if (currentLength >= previousLength) return new Set();
  const deleted = new Set();
  for (const signature of previous) {
    if (signature && !current.has(signature)) deleted.add(signature);
  }
  return deleted;
}

// chatChanged / groupSelected：切换/加载聊天后重建快照，并清理已消失楼层对应的档案。
// 首次见到某聊天时快照为空，diff 不会产生任何清理，避免扩展加载时误删历史数据。
function onFloorTraceChatChanged() {
  const ctx = getContextSafe();
  if (!ctx) return;
  ensureFloorTraceObserver();
  const deleted = diffFloorTraceSnapshot(ctx);
  if (deleted.size > 0) purgeArchiveEntriesForDeletedFloors(ctx, deleted);
}

// messageDeleted：SillyTavern / TauriTavern 的该事件只回传「新聊天长度」，不提供被删消息本身，
// 因此统一用快照对比找出已消失的楼层（删楼 / 重生成都会触发该事件，幂等可重复执行）。
function onFloorTraceMessageDeleted() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const deleted = diffFloorTraceSnapshot(ctx);
  if (deleted.size > 0) purgeArchiveEntriesForDeletedFloors(ctx, deleted);
}

// 聊天 DOM 观察：删楼 / 重生成会移除 .mes 元素、不触发 chatChanged，宿主事件也只回传长度；
// 观察 #chat 的结构变化既维持快照新鲜（新增楼层），也能在宿主事件缺失时兜底清理。
// 兜底分两条路：
// 1. 直接消费 MutationRecord.removedNodes：被移除的 .mes 元素带 mesid（消息在 chat 里的下标），
//    对照「上次快照时的聊天副本」即可拿到被删消息本身，签名直接清理——不依赖快照时序，
//    连续删两层（最新 assistant + 最新 user）时每层移除都会各自触发，两层都能清到；
// 2. 快照 diff 兜底：与 removedNodes 路径幂等，覆盖 removedNodes 拿不到消息的场景。
// 聊天切换 / 重载会先清空 DOM 再重新渲染，此时 ctx.chat 为空或 chatKey 已切换，
// 直接跳过对比，避免把「重渲染」误判成「删楼」；其他扩展原地改写消息内容
// （如智绘姬重渲染最新楼层）由 diff 的楼层数守卫拦截，同样不会误清理。
let floorTraceObserver = null; // { observer, target }
let floorTraceLastChatKey = '';
let floorTraceLastChat = []; // 上次快照时的聊天副本（按下标取被删消息）

function onFloorTraceDomChanged(records) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const chatKey = getCurrentChatKey(ctx);
  if (chatKey !== floorTraceLastChatKey) {
    // 聊天切换中：保留新旧快照，等 chatChanged 拿到完整聊天后再对比。
    floorTraceLastChatKey = chatKey;
    return;
  }
  // 路径 1：直接消费被移除的 .mes 元素（mesid = 消息在 chat 里的下标），
  // 从上次快照的聊天副本取回被删消息签名并清理。连续删两层时每层各触发一次，
  // 不受「两次删除之间快照被提前重建」影响。
  const removedSignatures = new Set();
  if (Array.isArray(records)) {
    for (const record of records) {
      // 真实浏览器里 removedNodes / addedNodes 是 NodeList（可迭代、有 length），测试沙箱里是数组。
      if (!record || !record.removedNodes || typeof record.removedNodes.length !== 'number') continue;
      for (const node of record.removedNodes) {
        if (!node || typeof node.getAttribute !== 'function') continue;
        // 元素仍连接在 DOM（移动 / 重排）或同一记录里又被加回（move）不算删除。
        if (node.isConnected || (record.addedNodes && Array.prototype.includes.call(record.addedNodes, node))) continue;
        const mesElements = node.classList && node.classList.contains('mes')
          ? [node]
          : (typeof node.querySelectorAll === 'function' ? node.querySelectorAll('.mes') : []);
        for (const mes of mesElements) {
          const mesId = mes.getAttribute('mesid');
          if (mesId === null || mesId === undefined || mesId === '') continue;
          const message = floorTraceLastChat[Number(mesId)];
          const signature = message ? buildAutoArchiveSignature(message) : '';
          if (signature) removedSignatures.add(signature);
        }
      }
    }
  }
  const chat = Array.isArray(ctx.chat) ? ctx.chat : [];
  if (chat.length === 0) return; // 清空 / 重载中：保留快照，等 chatChanged 重建。
  // 与 diff 同款守卫：楼层数必须减少才算删楼（内容编辑 / 重渲染 / 虚拟化窗口滚动不清理），
  // 且被删签名必须已不在当前聊天里（重渲染后元素被替换时，消息内容仍在聊天中，不清理）。
  const previousLength = floorTraceLastLengths.get(chatKey) ?? 0;
  if (chat.length < previousLength && removedSignatures.size > 0) {
    const currentSignatures = getChatSignatureSet(ctx);
    const toPurge = new Set();
    for (const signature of removedSignatures) {
      if (!currentSignatures.has(signature)) toPurge.add(signature);
    }
    if (toPurge.size > 0) purgeArchiveEntriesForDeletedFloors(ctx, toPurge);
  }
  // 路径 2：快照 diff 兜底（幂等，覆盖 removedNodes 拿不到消息的场景）。
  const deleted = diffFloorTraceSnapshot(ctx);
  if (deleted.size > 0) purgeArchiveEntriesForDeletedFloors(ctx, deleted);
}

function ensureFloorTraceObserver() {
  if (typeof globalThis.MutationObserver === 'undefined' || typeof document === 'undefined') return;
  const container = document.getElementById('chat') || (document.querySelector('.mes')?.parentElement || null);
  if (!container) return;
  if (floorTraceObserver && floorTraceObserver.target === container) return;
  if (floorTraceObserver && floorTraceObserver.observer) floorTraceObserver.observer.disconnect();
  const observer = new MutationObserver(onFloorTraceDomChanged);
  observer.observe(container, { childList: true, subtree: true });
  floorTraceObserver = { observer, target: container };
  const ctx = getContextSafe();
  if (ctx) {
    floorTraceLastChatKey = getCurrentChatKey(ctx);
    rebuildFloorTraceSnapshot(ctx);
  }
}
// ---------- 注册系统：视图 UI ----------
function registerCharacter(name) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    globalThis.toastr?.warning?.('请输入角色名字', `[${MODULE_NAME}]`);
    return;
  }
  const roster = getRoster(ctx);
  if (!roster) return;
  if (roster[trimmed]) {
    globalThis.toastr?.warning?.(`「${trimmed}」已在名单中`, `[${MODULE_NAME}]`);
    return;
  }
  roster[trimmed] = createEmptyArchive(trimmed);
  saveSettingsImmediate(ctx);
  logApp('info', '角色已注册', trimmed);
  globalThis.toastr?.success?.(`「${trimmed}」已加入名单`, `[${MODULE_NAME}]`);
  renderRegisterList();
  renderArchiveList();
  refreshHomeStatuses();
}

async function unregisterCharacter(name) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const roster = getRoster(ctx);
  if (!roster || !roster[name]) return;
  const confirmed = await showConfirm(`确定注销「${name}」？该角色的档案数据将被删除。`);
  if (!confirmed) return;
  cancelCharacterAnalysis(name);
  delete roster[name];
  saveSettingsImmediate(ctx);
  logApp('info', '角色已注销', name);
  globalThis.toastr?.info?.(`「${name}」已注销`, `[${MODULE_NAME}]`);
  renderRegisterList();
  renderArchiveList();
  refreshHomeStatuses();
}

function renderRegisterList() {
  const list = document.getElementById(REGISTER_LIST_ID);
  if (!list) return;
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {}).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const status = document.getElementById(REGISTER_STATUS_ID);
  if (status) status.textContent = `${names.length} 个角色`;
  const chatNode = document.getElementById(REGISTER_CHAT_ID);
  if (chatNode) chatNode.textContent = `绑定聊天：${getCurrentChatLabel(ctx)}`;
  list.textContent = '';
  if (names.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-register__empty';
    empty.textContent = '还没有注册任何角色 —— 输入名字即可加入名单。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const name of names) {
    const item = document.createElement('div');
    item.className = 'soullink-register__item';
    const nameNode = document.createElement('span');
    nameNode.className = 'soullink-register__item-name';
    nameNode.textContent = name;
    const unregister = document.createElement('button');
    unregister.type = 'button';
    unregister.className = 'soullink-register__unregister';
    unregister.textContent = '注销';
    unregister.title = `注销「${name}」并删除其档案数据`;
    unregister.addEventListener('click', () => unregisterCharacter(name));
    item.append(nameNode, unregister);
    fragment.appendChild(item);
  }
  list.appendChild(fragment);
}

function initRegisterSection(panel) {
  if (!panel || panel.dataset.registerReady === 'true') return;
  const submit = () => {
    const input = document.getElementById(REGISTER_INPUT_ID);
    registerCharacter(input?.value || '');
    if (input) input.value = '';
    input?.focus?.();
  };
  document.getElementById(REGISTER_ADD_ID)?.addEventListener('click', submit);
  document.getElementById(REGISTER_INPUT_ID)?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  });
  document.getElementById(REGISTER_NPC_TOGGLE_ID)?.addEventListener('click', toggleNpcDeduction);
  renderRegisterList();
  renderNpcDeductionToggle();
  panel.dataset.registerReady = 'true';
  logApp('info', '角色扮演已就绪');
}
