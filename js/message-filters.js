// ---------- 消息正则过滤 ----------
// 四种调用（档案分析 / 档案预筛 / 角色扮演预筛 / 角色推演）都经 getRecentMessages
// 取「最近几条消息」，过滤只需在这一处生效：按启用的正则把每条消息内容中匹配的
// 部分剔除，整条内容都被匹配的消息不再进入上下文。
let messageFilterIdCounter = 0;
function generateMessageFilterId() {
  messageFilterIdCounter += 1;
  return 'filter-' + Date.now().toString(36) + '-' + messageFilterIdCounter.toString(36);
}

function normalizeMessageFilter(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const name = String(item.name || '').trim();
  const pattern = String(item.pattern || '').trim();
  const flags = String(item.flags || '').trim();
  if (!name || !pattern) return null;
  try {
    new RegExp(pattern, flags);
  } catch {
    return null;
  }
  return {
    id: String(item.id || generateMessageFilterId()),
    name,
    pattern,
    flags,
    enabled: item.enabled !== false,
  };
}

function normalizeMessageFilterList(list) {
  const seen = new Set();
  const result = [];
  for (const item of Array.isArray(list) ? list : []) {
    const normalized = normalizeMessageFilter(item);
    if (!normalized) continue;
    if (seen.has(normalized.id)) normalized.id = generateMessageFilterId();
    seen.add(normalized.id);
    result.push(normalized);
  }
  return result;
}

function getMessageFilterList(settings) {
  return Array.isArray(settings?.messageFilters) ? settings.messageFilters : [];
}

// 编译当前启用的正则；个别表达式无效时跳过并告警，不影响其余过滤。
function compileMessageFilters(settings) {
  const compiled = [];
  for (const item of getMessageFilterList(settings)) {
    if (!item || item.enabled === false) continue;
    const pattern = String(item.pattern || '').trim();
    if (!pattern) continue;
    try {
      compiled.push(new RegExp(pattern, String(item.flags || '')));
    } catch (error) {
      logApp('warn', '消息正则过滤：表达式无效，已跳过', String(item.name || ''), String(error?.message || error));
    }
  }
  return compiled;
}

// ---------- 档案分析：AI 调用 ----------
function getRecentMessages(count) {
  const ctx = getContextSafe();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  let filters = [];
  try {
    filters = compileMessageFilters(ctx ? getSettings(ctx) : null);
  } catch (error) {
    console.warn('[' + MODULE_NAME + '] unable to read message filters', error);
  }
  const messages = [];
  for (const message of chat.slice(-count)) {
    const raw = String(message?.mes || '');
    let content = raw;
    if (filters.length > 0) {
      for (const regex of filters) content = content.replace(regex, '');
      content = content.trim();
      // 原本有内容、但全部被正则剔除 → 整条消息不进入上下文
      if (content === '' && raw.trim() !== '') continue;
    }
    messages.push({
      role: message?.is_user ? 'user' : (message?.is_system ? 'system' : 'assistant'),
      name: String(message?.name || ''),
      content,
    });
  }
  return messages;
}

