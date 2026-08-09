function serializeArchiveForPrompt(archive) {
  const fields = {};
  for (const key of ARCHIVE_SCALAR_FIELDS) fields[key] = String(archive.fields[key] || '');
  const profile = { fields };
  for (const section of ARCHIVE_SECTIONS) {
    profile[section.key] = (Array.isArray(archive[section.key]) ? archive[section.key] : [])
      .map((item) => ({ id: String(item.id || ''), content: String(item.content || '') }));
  }
  return profile;
}

// 档案分析请求体（v0.8.4 起）按「提示词 → 剧情 → 世界书 → 输入」四段式组织：
// 1. system 档案系统提示词；
// 2. user 剧情段：引导消息 + <Recent_Messages> 块（最近几条消息，XML 包裹）；
// 3. user 世界书段：引导消息 + <World_Info_Before>/<World_Info_Extra>/<World_Info_After> 块（有则发）；
// 4. user 输入段：JSON（character / current_profile / turn_index，剧情与世界书已独立成节，不再重复携带）。
async function buildArchiveAnalysisMessages(name, archive, prompt) {
  const recentMessages = getRecentMessages(ARCHIVE_RECENT_MESSAGE_COUNT);
  const payload = {
    character: name,
    current_profile: serializeArchiveForPrompt(archive),
    turn_index: (getContextSafe()?.chat?.length) || 0,
  };
  // 世界书按酒馆规则的触发结果，注入在分析提示词的「合适位置」：
  // before 块放最前、after 块放最后（与酒馆 worldInfoBefore/After 的语义一致）。
  const worldInfo = await resolveWorldInfoForAnalysis();
  const worldBlocks = [];
  if (worldInfo.before) worldBlocks.push(`<World_Info_Before>\n${worldInfo.before}\n</World_Info_Before>`);
  if (worldInfo.extra) worldBlocks.push(`<World_Info_Extra>\n${worldInfo.extra}\n</World_Info_Extra>`);
  if (worldInfo.after) worldBlocks.push(`<World_Info_After>\n${worldInfo.after}\n</World_Info_After>`);
  const messages = [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        `以下是最新的剧情（最近 ${ARCHIVE_RECENT_MESSAGE_COUNT} 条消息），可能包含该角色不在场的段落。`,
        '请先判断该角色本轮是否在场、真实获知或亲历了什么，再据此更新人物档案',
        '（标量字段、性格、世界观、家庭背景、人际关系与记忆）；该角色不在场的内容只作背景，不得写入其档案。',
        '',
        `<Recent_Messages>\n${JSON.stringify(recentMessages, null, 2)}\n</Recent_Messages>`,
      ].join('\n'),
    },
    ...(worldBlocks.length > 0 ? [{
      role: 'user',
      content: [
        '以下是世界书注入内容，包含人物档案与世界背景信息：与 character 同名的条目是该角色本人的设定卡，',
        '是权威设定来源，可直接用于补全其档案；对所有人生效的普适世界设定（社会秩序、认主体系、超自然规则等）',
        '是该角色默认知晓的常识，应写入其世界观；其他角色的个人条目与私密信息仅作背景参考，',
        '只有该角色确实获知的内容才能写入其档案。',
        '',
        worldBlocks.join('\n\n'),
      ].join('\n'),
    }] : []),
    {
      role: 'user',
      content: [
        '以下是本轮的输入 JSON，其中 current_profile 就是当前角色的人物档案：',
        '- character：本轮要维护档案的角色名。',
        '- current_profile：该角色当前已记录的完整档案（标量字段 + 各分节条目，每条带 id），是唯一权威现状。',
        '- turn_index：当前对话的消息索引，仅供参考。',
        '',
        '请按【输出契约】约定的格式对本档案进行维护：fields 覆盖本轮需要改写的标量字段；',
        '各分节按 add / remove / update 增量更新——add 的新条目避免与 current_profile 已有内容重复，',
        'remove / update 的 id 必须来自 current_profile 中已有的 id。',
        '',
        JSON.stringify(payload, null, 2),
      ].join('\n'),
    },
  ];
  if (worldBlocks.length === 0) {
    logApp('warn', '世界书未注入内容', worldInfo.mode, worldInfo.counts, worldInfo.names);
  } else {
    logApp('info', '世界书注入', worldInfo.mode, worldInfo.counts, worldInfo.names);
  }
  return messages;
}

// TauriTavern 宿主代理的对话接口是 /api/backends/chat-completions/generate，
// 请求体与 SillyTavern 的 /chat-completions 不同：custom_include_headers 的值
// 需带引号（`Authorization: "Bearer xxx"`）。参数格式参考 st-chatu8 扩展。
function buildHostProxyChatConfig(apiBase, settings, body) {
  const apiKey = String(settings?.apiKey || '').trim();
  return {
    chat_completion_source: 'custom',
    custom_url: apiBase,
    custom_include_headers: apiKey ? `Authorization: "Bearer ${apiKey}"` : '',
    ...body,
  };
}

async function requestHostProxyChatCompletion(apiBase, settings, body, signal) {
  return fetchText('/api/backends/chat-completions/generate', {
    method: 'POST',
    headers: getHostProxyHeaders(),
    body: JSON.stringify(buildHostProxyChatConfig(apiBase, settings, body)),
    cache: 'no-cache',
    timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
    signal,
  });
}

function createCancelError() {
  const error = new Error('请求已取消');
  error.name = 'SoulLinkCancelError';
  return error;
}

function createChatError(message, retryable = false) {
  const error = new Error(message);
  error.retryable = retryable;
  return error;
}

// 带取消感知的等待：分析中途点「取消」时能立即中断重试间隙。
async function sleepAbortable(ms, signal) {
  if (signal?.aborted) throw createCancelError();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(createCancelError());
    };
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

// ---------- API 并发限制 ----------
// 同时进行的 AI 对话请求上限（默认 3，可在「API 连接」面板调整并发数与开关）。
// 超出的请求排队等待，某个请求完成后再放行一个；关闭限制或上限 < 1 时不排队。
const apiConcurrencyState = { active: 0, queue: [], limit: 0 };

// 排队 toast：队列长度变化时原地更新「当前 N 个请求正在排队」，队列清空后自动关闭。
const apiQueueToast = { element: null, messageEl: null };
let apiQueueToastUnmanaged = false; // 宿主 toastr 不返回元素时，本次排队期间只提示一次

function closeApiQueueToast() {
  if (apiQueueToast.element) {
    try {
      globalThis.toastr?.clear?.(apiQueueToast.element, true);
    } catch (error) {
      console.warn(`[${MODULE_NAME}] unable to clear queue toast`, error);
    }
  }
  apiQueueToast.element = null;
  apiQueueToast.messageEl = null;
  apiQueueToastUnmanaged = false;
}

function updateApiQueueToast(limit, queueLength) {
  if (queueLength <= 0) {
    closeApiQueueToast();
    return;
  }
  const toastr = globalThis.toastr;
  if (!toastr?.info || apiQueueToastUnmanaged) return;
  const message = `AI 请求已达并发上限（${limit}），当前 ${queueLength} 个请求正在排队等待`;
  if (apiQueueToast.messageEl && apiQueueToast.messageEl.isConnected) {
    apiQueueToast.messageEl.textContent = message;
    return;
  }
  // 首次排队：弹一条长驻 toast，并拿到 DOM 引用，之后队列变化时原地更新文案。
  try {
    const toastElement = toastr.info(message, `[${MODULE_NAME}]`, { timeOut: 12000, extendedTimeOut: 4000 });
    if (!toastElement) {
      apiQueueToastUnmanaged = true;
      return;
    }
    const root = toastElement.jquery ? toastElement[0] : toastElement;
    if (!root) {
      apiQueueToastUnmanaged = true;
      return;
    }
    apiQueueToast.element = root;
    apiQueueToast.messageEl = root.querySelector?.('.toast-message') || null;
    if (!apiQueueToast.messageEl) apiQueueToastUnmanaged = true;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] unable to show queue toast`, error);
  }
}

function getApiConcurrencyLimit(settings) {
  if (settings?.apiConcurrencyEnabled === false) return 0;
  const limit = Number(settings?.apiConcurrencyLimit);
  return Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 0;
}

async function acquireApiConcurrencySlot(settings, signal) {
  const limit = getApiConcurrencyLimit(settings);
  if (limit <= 0) return () => {};
  if (signal?.aborted) throw createCancelError();
  if (apiConcurrencyState.active < limit) {
    apiConcurrencyState.active += 1;
    return releaseApiConcurrencySlot;
  }
  // 排队等待空闲名额；中途取消会立即出队并抛取消错误，避免请求滞留在队列里。
  const waiter = { resolve: null, reject: null, onAbort: null };
  const queued = new Promise((resolve, reject) => {
    waiter.resolve = resolve;
    waiter.reject = reject;
  });
  waiter.onAbort = () => {
    const index = apiConcurrencyState.queue.indexOf(waiter);
    if (index >= 0) {
      apiConcurrencyState.queue.splice(index, 1);
      updateApiQueueToast(apiConcurrencyState.limit, apiConcurrencyState.queue.length);
      waiter.reject(createCancelError());
    }
  };
  if (signal) {
    if (signal.aborted) throw createCancelError();
    signal.addEventListener('abort', waiter.onAbort, { once: true });
  }
  apiConcurrencyState.queue.push(waiter);
  apiConcurrencyState.limit = limit;
  if (signal?.aborted) waiter.onAbort();
  logApp('debug', 'API 并发已满，请求排队等待', `上限 ${limit} · 队列 ${apiConcurrencyState.queue.length}`);
  updateApiQueueToast(limit, apiConcurrencyState.queue.length);
  try {
    await queued;
  } finally {
    if (signal) signal.removeEventListener('abort', waiter.onAbort);
  }
  apiConcurrencyState.active += 1;
  return releaseApiConcurrencySlot;
}

function releaseApiConcurrencySlot() {
  apiConcurrencyState.active = Math.max(0, apiConcurrencyState.active - 1);
  const next = apiConcurrencyState.queue.shift();
  if (next) {
    next.resolve();
    updateApiQueueToast(apiConcurrencyState.limit, apiConcurrencyState.queue.length);
  }
}

// 单次对话请求：跨域走宿主代理，代理明显损坏（非 2xx / 非 JSON / 无内容 JSON /
// 401/403/404/405 / 路由不存在）时回退直连；返回 { content, transport }。
// 上游瞬态故障（空内容、429、5xx、busy 类错误信封）以 retryable 标记抛出，
// 由 chatCompletion 的外层循环自动重试。
async function requestChatCompletionOnce(apiBase, settings, body, signal) {
  const url = `${apiBase}/chat/completions`;
  const useHostProxy = isCrossOriginUrl(url);
  let response = null;
  let responseText = '';
  let transport = useHostProxy ? 'host-proxy' : 'direct';
  try {
    if (useHostProxy) {
      let proxyError = null;
      try {
        ({ response, responseText } = await requestHostProxyChatCompletion(apiBase, settings, body, signal));
      } catch (error) {
        if (signal?.aborted) throw createCancelError();
        proxyError = error;
        console.warn(`[${MODULE_NAME}] host proxy chat completion failed, trying direct`, error);
      }
      const proxyLooksBroken = !response?.ok || !looksLikeJson(responseText) || !responseContainsUsableText(responseText);
      if (proxyError || proxyLooksBroken || shouldFallbackFromHostProxy(responseText, response?.status)) {
        transport = 'direct-after-proxy-fallback';
        ({ response, responseText } = await fetchText(url, {
          method: 'POST',
          headers: getAuthHeaders(settings),
          body: JSON.stringify(body),
          timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
          signal,
        }));
      }
    } else {
      ({ response, responseText } = await fetchText(url, {
        method: 'POST',
        headers: getAuthHeaders(settings),
        body: JSON.stringify(body),
        timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
        signal,
      }));
    }
  } catch (error) {
    if (signal?.aborted) throw createCancelError();
    throw createChatError(`对话请求失败（${transport}）。请检查 API 配置。原始错误: ${String(error?.message || error)}`);
  }
  if (!response?.ok) {
    const transient = response?.status === 429 || (response?.status >= 500 && response?.status < 600);
    throw createChatError(`对话请求失败 ${response?.status}（${transport}）: ${String(responseText || '').slice(0, 240)}`, transient);
  }
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw createChatError(`对话响应不是 JSON（${transport}）: ${String(responseText || '').slice(0, 180)}`);
  }
  if (data && typeof data === 'object' && data.error) {
    const errorMessage = typeof data.error === 'string'
      ? data.error
      : (data.error.message || JSON.stringify(data.error));
    const transient = /(?:429|5\d\d|overload|busy|try again|temporarily|rate\s*limit|too\s*many)/i.test(String(errorMessage));
    throw createChatError(`上游 API 返回错误（${transport}）: ${String(errorMessage).slice(0, 240)}`, transient);
  }
  if (data && typeof data === 'object' && data.response != null && data.choices == null) {
    try {
      const nested = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
      if (nested && typeof nested === 'object') data = nested;
    } catch {}
  }
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text;
  if (typeof content !== 'string' || !content.trim()) {
    // deepseek-v4-flash 等带思考能力的模型偶发把最终答案写进 reasoning_content、
    // content 留空（finish_reason=stop，usage 全部计入 reasoning_tokens）——
    // 实测回复内容完整可用，直接兜底取用，避免误判「AI 未返回文本内容」。
    const reasoning = typeof choice?.message?.reasoning_content === 'string' ? choice.message.reasoning_content : '';
    if (reasoning.trim()) {
      logApp('warn', 'AI 回复内容位于 reasoning_content 字段', `${transport} · ${reasoning.length} 字符`);
      return { content: reasoning, transport };
    }
    const errorMessage = data?.error?.message ? `: ${data.error.message}` : '';
    // 空内容诊断：DeepSeek 推理模型（deepseek-reasoner）的 max_tokens 预算同时
    // 包含思维链与最终答案，思考阶段耗尽预算时会返回「200 + content 为空 +
    // finish_reason=length」，重试无法自愈，必须调大 max_tokens 或改用非推理模型。
    const finishReason = choice?.finish_reason ? `finish_reason=${choice.finish_reason}` : '';
    const budgetHint = finishReason === 'length'
      ? '（疑似思考阶段耗尽输出预算：请调大 max_tokens 或改用非推理模型）'
      : '';
    throw createChatError(`AI 未返回文本内容（${transport}）${errorMessage}${finishReason ? `（${finishReason}）` : ''}${budgetHint}`, true);
  }
  return { content, transport };
}

async function chatCompletion(settings, messages, options = {}) {
  const apiBase = getApiBase(settings);
  if (!apiBase) throw new Error('请先在「API 连接」中配置 Base URL');
  const model = String(settings?.model || '').trim();
  if (!model) throw new Error('请先在「API 连接」中选择模型');
  const body = {
    model,
    messages,
    stream: false,
    temperature: Number.isFinite(options.temperature) ? options.temperature : 0.2,
    max_tokens: Number.isFinite(options.maxTokens) && options.maxTokens > 0
      ? Math.floor(options.maxTokens)
      : CHAT_COMPLETION_DEFAULT_MAX_TOKENS,
  };
  const maxAttempts = Math.max(1, Math.min(5, Number(options.maxAttempts) > 0 ? Number(options.maxAttempts) : CHAT_COMPLETION_MAX_ATTEMPTS));
  // 并发限制：占住一个并发名额再发送；多出的请求排队等待，前面的请求完成后再放行。
  // 整个任务（含自动重试）占用同一个名额，任务结束或取消时立即释放。
  const release = await acquireApiConcurrencySlot(settings, options.signal);
  try {
    logApp('debug', '发送 AI 对话请求', `${model} · ${isCrossOriginUrl(`${apiBase}/chat/completions`) ? 'host-proxy' : 'direct'}`);
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (options.signal?.aborted) throw createCancelError();
      try {
        const { content, transport } = await requestChatCompletionOnce(apiBase, settings, body, options.signal);
        if (attempt > 1) {
          logApp('info', 'AI 对话请求重试成功', `${model} · ${transport} · 第 ${attempt}/${maxAttempts} 次`);
        } else {
          logApp('debug', 'AI 对话响应已接收', `${model} · ${transport}`);
        }
        return content;
      } catch (error) {
        if (options.signal?.aborted) throw createCancelError();
        lastError = error;
        const retryable = error?.retryable === true;
        if (retryable && attempt < maxAttempts) {
          const delayMs = CHAT_COMPLETION_RETRY_DELAY_MS * attempt;
          logApp('warn', 'AI 对话请求异常，稍后自动重试', `${model} · 第 ${attempt}/${maxAttempts} 次 · ${String(error.message || error).slice(0, 140)}`);
          await sleepAbortable(delayMs, options.signal);
          continue;
        }
        if (retryable && attempt > 1) {
          throw createChatError(`${String(error.message || error)}（已自动重试 ${attempt - 1} 次）`, true);
        }
        throw error;
      }
    }
    throw lastError || new Error('AI 对话请求失败');
  } finally {
    release();
  }
}

function parseAgentJson(text) {
  const source = String(text || '').trim();
  const fenced = source.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenced ? fenced[1].trim() : source;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {}
  }
  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw new Error(`AI 返回内容无法解析为 JSON：${String(error?.message || error)}`);
  }
}

function applyArchiveDiff(archive, diff, sourceFloor) {
  const changes = [];
  if (!diff || typeof diff !== 'object' || Array.isArray(diff)) return changes;
  if (diff.fields && typeof diff.fields === 'object' && !Array.isArray(diff.fields)) {
    for (const key of ARCHIVE_SCALAR_FIELDS) {
      if (diff.fields[key] === undefined || diff.fields[key] === null) continue;
      const value = String(diff.fields[key]).trim();
      if (archive.fields[key] !== value) {
        archive.fields[key] = value;
        changes.push(`字段「${ARCHIVE_SCALAR_LABELS[key]}」→ ${value}`);
      }
    }
  }
  for (const section of ARCHIVE_SECTIONS) {
    const ops = diff[section.key];
    if (!ops || typeof ops !== 'object' || Array.isArray(ops)) continue;
    applySectionOps(archive, section, ops, changes, sourceFloor);
  }
  return changes;
}

function applySectionOps(archive, section, ops, changes, sourceFloor) {
  const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
  const removeIds = new Set((Array.isArray(ops.remove) ? ops.remove : []).map((id) => String(id)));
  const removed = items.filter((item) => !removeIds.has(String(item.id)));
  if (removed.length !== items.length) {
    changes.push(`「${section.label}」移除 ${items.length - removed.length} 条`);
  }

  const updateById = new Map();
  (Array.isArray(ops.update) ? ops.update : []).forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) updateById.set(String(item.id), String(item.content ?? ''));
  });
  const next = removed.map((item) => {
    const content = updateById.get(String(item.id));
    if (content === undefined || content === item.content) return item;
    changes.push(`「${section.label}」更新 ${item.id}`);
    return { ...item, content };
  });

  const seenContents = new Set(next.map((item) => item.content));
  const usedIds = new Set(items.map((item) => String(item.id)));
  const additions = Array.isArray(ops.add) ? ops.add : [];
  for (const addition of additions) {
    const content = String(typeof addition === 'string' ? addition : addition?.content ?? '').trim();
    if (!content) continue;
    if (seenContents.has(content)) continue;
    let id = null;
    if (addition && typeof addition === 'object' && addition.id !== undefined && addition.id !== null) {
      const candidate = String(addition.id).trim();
      if (candidate && !usedIds.has(candidate)) id = candidate;
    }
    if (!id) id = nextSectionItemId(section, next);
    const item = { id, content };
    if (sourceFloor) item.source = sourceFloor;
    next.push(item);
    usedIds.add(id);
    seenContents.add(content);
    changes.push(`「${section.label}」新增 ${content.length > 24 ? `${content.slice(0, 24)}…` : content}`);
  }

  archive[section.key] = next;
}

async function analyzeCharacter(name) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : null;
  const archive = roster?.[name];
  if (!ctx || !archive) return 'skipped';
  if (archiveAnalysisState[name]?.state === 'busy') return 'busy';
  const settings = getSettings(ctx);
  const prompt = getPromptSavedText('archiveSystem', ctx);
  if (!prompt) {
    globalThis.toastr?.error?.('未找到「档案系统」提示词', `[${MODULE_NAME}]`);
    return 'skipped';
  }
  const controller = new AbortController();
  archiveAnalysisState[name] = { state: 'busy', message: '分析中…', controller };
  renderArchiveCard(name);
  renderAnalyzeAllButton();
  logApp('info', '开始分析角色档案', name);
  let rawContent = '';
  try {
    const messages = await buildArchiveAnalysisMessages(name, archive, prompt);
    rawContent = await chatCompletion(settings, messages, { signal: controller.signal });
    const diff = parseAgentJson(rawContent);
    const changes = applyArchiveDiff(archive, diff, getCurrentFloorSignature(ctx));
    archive.updatedAt = Date.now();
    saveSettingsImmediate(ctx);
    const summary = changes.length > 0 ? `更新 ${changes.length} 处` : '无变化';
    archiveAnalysisState[name] = { state: 'ok', message: summary };
    logApp('info', '角色档案分析完成', name, summary);
    globalThis.toastr?.success?.(`「${name}」${summary}`, `[${MODULE_NAME}]`);
    return 'ok';
  } catch (error) {
    const cancelled = controller.signal.aborted || error?.name === 'SoulLinkCancelError' || error?.name === 'AbortError';
    if (cancelled) {
      // 取消按钮点击时已把状态置为 cancelled，这里不再覆盖；
      // 若因其他原因中断（如宿主提前 abort），则补齐状态。
      if (archiveAnalysisState[name]?.state !== 'cancelled') {
        archiveAnalysisState[name] = { state: 'cancelled', message: '已取消' };
      }
      logApp('info', '角色档案分析已取消', name);
      return 'cancelled';
    }
    console.error(`[${MODULE_NAME}] analyzeCharacter failed`, error);
    const message = String(error?.message || error);
    archiveAnalysisState[name] = {
      state: 'error',
      message: '分析失败',
      detail: { rawContent, errorMessage: message },
    };
    logApp('error', '角色档案分析失败', name, message);
    globalThis.toastr?.error?.(`「${name}」分析失败：${message.slice(0, 160)}`, `[${MODULE_NAME}]`);
    return 'error';
  } finally {
    renderArchiveCard(name);
    renderAnalyzeAllButton();
    refreshHomeStatuses();
  }
}

// ---------- 自动档案维护：Gate 预筛 + 并发分析 ----------
// 触发时机：宿主每轮生成结束（generationEnded）且确实产出了新的 AI 回复。
// Gate 输入刻意保持最小：只送「已注册角色名单 + 最近 4 条消息」，不送档案、世界书等
// 其他上下文（与「档案预筛」提示词的输入说明一致）；Gate 只负责缩小名单，不产出内容。
// 稳定性设计（参考 NPC Tracker 流程，但规避其已知缺陷）：
// - 末条签名去重：同一末条被宿主反复触发（自动续写/事件重放）只处理一次；
// - 运行锁：上一轮 Gate/分析还在飞时新事件直接跳过，杜绝并发 API 风暴；
// - 中断检查：生成被用户中止时跳过，不对半截回复发起分析；
// - 名单交集：Gate 返回的名字必须与已注册名单求交集，未知名字一律丢弃；
// - 失败即跳过本轮：Gate 调用失败不降级、不重试轰炸，本轮视为已处理。
const autoArchiveState = {
  running: false,
  lastSignature: '',
};

function buildAutoArchiveSignature(message) {
  if (!message) return '';
  return [
    message.is_user ? 'user' : 'assistant',
    String(message.name || ''),
    String(message.mes || ''),
  ].join('|');
}

// 主生成流程跟踪：防止其他插件自行广播 generationEnded 误触发自动档案维护。
// 只有「generationStarted → generationEnded」配对、且末条消息确实变化的事件
// 才视为主聊天生成结束；其他插件（翻译/摘要/续写等）完成自己的 API 调用后
// 广播 generationEnded 时，没有对应的 generationStarted 或末条未变化，直接跳过。
const mainGenerationState = {
  startChatSignature: '',
};

function onMainGenerationStarted() {
  const ctx = getContextSafe();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const last = chat[chat.length - 1];
  mainGenerationState.startChatSignature = last ? buildAutoArchiveSignature(last) : '';
}

function onMainGenerationStopped() {
  mainGenerationState.startChatSignature = '';
}

// 切换/加载聊天时清空跟踪：避免「上一轮生成失败残留的签名」在换聊天后被
// 其他插件的 generationEnded 误用（chatChanged 只在切换/加载聊天时触发，
// 生成过程中新增/删除消息不会触发，因此不会误清进行中的生成跟踪）。
function onMainGenerationChatChanged() {
  mainGenerationState.startChatSignature = '';
}

// Gate 请求体（v1.0.9 起精简为 4 条消息）按「提示词 → 名单块 → 剧情块 → 输出契约」组织：
// 1. system 档案预筛提示词；
// 2. user 名单段：引导 + <Registered_Characters> 块（已注册名单，XML 包裹）；
// 3. user 剧情段：引导 + <Recent_Messages> 块（最近 4 条消息，XML 包裹）；
// 4. user 输出契约段：约定 JSON 模板。
// 与「档案预筛」默认提示词的输入说明保持一致，recent_messages 严格取最近 4 条；
// 刻意不携带档案、世界书等任何其他上下文。v1.0.9 起引导与数据块合并为同一条消息、
// JSON 紧凑序列化（省缩进 token），减少消息轮次与输入体积，加快 Gate 返回。
function buildAutoArchiveGateMessages(names, prompt) {
  const recentMessages = getRecentMessages(ARCHIVE_RECENT_MESSAGE_COUNT);
  const namesText = JSON.stringify(names);
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        '以下被 <Registered_Characters>...</Registered_Characters> 包裹的是当前全部已注册角色名单，这是唯一的候选集。',
        '只从这份名单中挑选：名单之外的角色（即使出现在对话里）一律不列入。',
        `<Registered_Characters>\n${namesText}\n</Registered_Characters>`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `以下被 <Recent_Messages>...</Recent_Messages> 包裹的是当前场景的最新 ${ARCHIVE_RECENT_MESSAGE_COUNT} 条消息（含各角色在场与不在场的段落）。`,
        '请据此判断名单中哪些角色本轮确实获得了新信息、新经历，或关系、背景出现了值得记录的新内容；只从名单中挑选，名单外的角色一律忽略。',
        '有实际出场并参与互动、或在场获知了重要信息的角色通常就有新记忆可记录，只有完全没有出场或确实无新信息的角色才不列入。',
        `<Recent_Messages>\n${JSON.stringify(recentMessages)}\n</Recent_Messages>`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: `请按约定输出 JSON，只从名单中列出本轮确实有值得记录内容的角色：\n\n${JSON.stringify({ characters: [] })}`,
    },
  ];
}

// 解析 Gate 返回名单，并与已注册名单求交集：模型可能返回乱格式、含未注册名或根本没返回
// characters，这里统一归一化后只保留已注册名单中的角色名，杜绝未知名字混进后续分析。
// 名字只做精确匹配（去空白后逐字一致）：简称/昵称无法靠代码可靠映射到全名（不同游戏
// 的称呼习惯不同），靠提示词约束模型输出名单全名，0 入选时日志会附原文便于排查。
function parseGateCharacterNames(parsed, registeredNames) {
  const allowed = new Set(registeredNames);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  if (!Array.isArray(parsed.characters)) return [];
  const out = [];
  const seen = new Set();
  for (const item of parsed.characters) {
    const name = String(item ?? '').trim();
    if (!name || seen.has(name) || !allowed.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

async function runAutoArchiveGate(ctx, settings, names, signature) {
  autoArchiveState.running = true;
  // 先标记签名再跑：同一末条被宿主反复触发时直接走签名去重，不再重跑 Gate。
  autoArchiveState.lastSignature = signature;
  try {
    const prompt = getPromptSavedText('archivePreScreen', ctx);
    if (!prompt) {
      logApp('warn', '自动档案维护跳过：未找到「档案预筛」提示词');
      return;
    }
    const messages = buildAutoArchiveGateMessages(names, prompt);
    logApp('info', '自动档案维护：预筛开始', `${names.length} 个已注册角色`);
    globalThis.toastr?.info?.('档案预筛中…', `[${MODULE_NAME}]`);
    // Gate 只产出角色名单，输出量小：限制 maxTokens 并降低 temperature，
    // 避免模型长篇输出拖慢高频调用，同时保持判定确定性。
    const content = await chatCompletion(settings, messages, { maxTokens: 1024, temperature: 0.1 });
    const parsed = parseAgentJson(content);
    const selected = parseGateCharacterNames(parsed, names);
    logApp('info', '自动档案维护：预筛完成', `入选 ${selected.length}/${names.length} 个角色`, selected);
    if (selected.length === 0) {
      logApp('debug', '自动档案维护：预筛 0 入选，原文', String(content || '').slice(0, 400));
      globalThis.toastr?.info?.('预筛完成：本轮无角色需要更新档案', `[${MODULE_NAME}]`);
      return;
    }
    globalThis.toastr?.info?.(`预筛完成：入选 ${selected.length}/${names.length} 个角色，开始更新档案`, `[${MODULE_NAME}]`);
    // 复用现有逐角色档案分析（含世界书注入与增量更新），并发执行。
    const results = await runArchiveAnalysisBatch(selected);
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
    logApp('info', '自动档案维护：分析结束', parts.join('，') || '无角色可分析');
    if (counts.error > 0) {
      globalThis.toastr?.warning?.(`自动档案维护完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
    } else if (counts.ok > 0) {
      globalThis.toastr?.success?.(`自动档案维护完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
    }
  } catch (error) {
    const message = String(error?.message || error);
    logApp('error', '自动档案维护失败', message);
    globalThis.toastr?.error?.(`自动档案维护失败：${message.slice(0, 160)}`, `[${MODULE_NAME}]`);
  } finally {
    autoArchiveState.running = false;
  }
}

async function onAutoArchiveGenerationEnded() {
  const ctx = getContextSafe();
  if (!ctx) return;
  let settings;
  try {
    settings = getSettings(ctx);
  } catch (error) {
    console.warn(`[${MODULE_NAME}] 自动档案维护：读取设置失败`, error);
    return;
  }
  if (!settings.autoArchiveEnabled) return;
  // 用户中断生成：跳过，避免对半截回复发起分析。
  if (ctx?.streamingProcessor?.abortController?.signal?.aborted) {
    logApp('info', '自动档案维护跳过：生成被中断');
    return;
  }
  const chat = Array.isArray(ctx.chat) ? ctx.chat : [];
  const lastMessage = chat[chat.length - 1];
  // 末条不是 AI 回复（空生成/失败/系统消息）：本轮没有可分析的新剧情。
  if (!lastMessage || lastMessage.is_user || lastMessage.is_system) {
    logApp('debug', '自动档案维护跳过：末条不是 AI 回复');
    return;
  }
  // 非主生成流程的 generationEnded（其他插件自行广播）直接跳过：
  // 只有「generationStarted → generationEnded」配对才视为主聊天生成结束。
  if (mainGenerationState.startChatSignature === '') {
    logApp('debug', '自动档案维护跳过：非主生成流程的 generationEnded');
    return;
  }
  const startSignature = mainGenerationState.startChatSignature;
  mainGenerationState.startChatSignature = '';
  const signature = buildAutoArchiveSignature(lastMessage);
  // 末条消息与生成开始时一致 → 本轮没有产出新 AI 回复（插件广播/事件重放）。
  if (signature === startSignature) {
    logApp('debug', '自动档案维护跳过：末条消息未变化');
    return;
  }
  if (autoArchiveState.lastSignature === signature) {
    logApp('debug', '自动档案维护跳过：本轮已处理');
    return;
  }
  if (autoArchiveState.running) {
    logApp('debug', '自动档案维护跳过：上一轮仍在运行');
    return;
  }
  const roster = getRoster(ctx);
  const names = Object.keys(roster || {});
  if (names.length === 0) {
    logApp('debug', '自动档案维护跳过：无已注册角色');
    return;
  }
  if (!getApiBase(settings) || !String(settings.model || '').trim()) {
    logApp('warn', '自动档案维护跳过：API 未配置');
    globalThis.toastr?.warning?.('自动档案维护已开启，但 API 尚未配置（Base URL / 模型）', `[${MODULE_NAME}]`);
    return;
  }
  await runAutoArchiveGate(ctx, settings, names, signature);
}

// ---------- 剧情前置 NPC 推演：Gate 预筛 + 并发推演 + 注入 ----------
// 触发时机：用户点击发送（宿主 messageSent 事件；宿主的 emit 会 await 监听器），
// 本模块的监听器返回 Promise，从而在「推演完成并注入」之前阻塞主模型请求。
// 流程：Gate（角色扮演预筛：名单 + 最近 4 条消息）→ 入选角色并发推演
// （角色扮演：该角色档案 + 最近 4 条消息，角色之间不共享上下文）→ 拼接
// <NPC_Deduction> 块 → setExtensionPrompt(IN_CHAT, depth 0, SYSTEM) 注入到
// 最后一条用户消息正下方 → 恢复发送；generationEnded / generationStopped 后清空注入。
// 稳定性设计（沿用自动档案维护的思路，针对「发送前阻塞」再做加固）：
// - 运行锁 + 签名去重：上一轮推演还在飞时新发送直接放行（本轮内容已覆盖）；
// - 名单交集：Gate 返回的名字必须与已注册名单求交集，未知名字一律丢弃；
// - 失败即降级：Gate 失败 → 不注入直接放行；单角色失败 → 其余角色继续；
// - 总超时：NPC_DEDUCTION_TIMEOUT_MS 硬截止，中止在途请求并放行发送；
// - 注入清理：每轮开始前清旧注入，generationEnded / generationStopped 再清一次；
// - 能力检查：宿主不提供 setExtensionPrompt / extension_prompt_types 时静默跳过。
const npcDeductionState = {
  running: false,
  lastSignature: '',
};
// 最近一轮推演快照：供首页「上一轮角色扮演」可视化查看（含各角色独白与注入原文）。
let npcDeductionLastRound = null;
function getExtensionPromptApi(ctx) {
  const context = ctx || getContextSafe();
  if (!context) return null;
  const setExtensionPrompt = typeof context.setExtensionPrompt === 'function'
    ? context.setExtensionPrompt
    : (typeof globalThis.setExtensionPrompt === 'function' ? globalThis.setExtensionPrompt : null);
  // 标准 SillyTavern 的 getContext() 会提供 extension_prompt_types / extension_prompt_roles；
  // TauriTavern 2.x 的 getContext() 不提供这两个对象（也不挂 globalThis），
  // 因此只把 setExtensionPrompt 作为必需项，枚举值按已知数值常量兜底：
  // extension_prompt_types: NONE=-1, IN_PROMPT=0, IN_CHAT=1, BEFORE_PROMPT=2
  // extension_prompt_roles: SYSTEM=0, USER=1, ASSISTANT=2
  if (typeof setExtensionPrompt !== 'function') return null;
  const types = context.extension_prompt_types || globalThis.extension_prompt_types || null;
  const roles = context.extension_prompt_roles || globalThis.extension_prompt_roles || null;
  const inChat = (types && Number.isFinite(types.IN_CHAT)) ? types.IN_CHAT : 1;
  const systemRole = (roles && Number.isFinite(roles.SYSTEM)) ? roles.SYSTEM : 0;
  return { setExtensionPrompt, inChat, systemRole };
}

function clearNpcDeductionInjection(ctx) {
  const api = getExtensionPromptApi(ctx);
  if (!api) return;
  try {
    api.setExtensionPrompt(NPC_DEDUCTION_INJECT_KEY, '', api.inChat, 0);
  } catch (error) {
    logApp('warn', '清理角色推演注入失败', String(error?.message || error));
  }
}

function buildNpcDeductionSignature(message) {
  if (!message) return '';
  return [
    message.is_user ? 'user' : 'assistant',
    String(message.name || ''),
    String(message.mes || ''),
  ].join('|');
}

// Gate 请求体（v1.0.12 起精简为 4 条消息）按「提示词 → 名单块 → 剧情块 → 输出契约」组织：
// 1. system 角色扮演预筛提示词；
// 2. user 名单段：引导 + <Registered_Characters> 块（已注册名单，XML 包裹）；
// 3. user 剧情段：引导 + <Recent_Messages> 块（最近 4 条消息，XML 包裹）；
// 4. user 输出契约段：约定 JSON 模板。
// 与「角色扮演预筛」默认提示词的输入说明保持一致，recent_messages 严格取最近 4 条；
// 刻意不携带档案、世界书等任何其他上下文。v1.0.12 起引导与数据块合并为同一条消息、
// JSON 紧凑序列化（省缩进 token），减少消息轮次与输入体积，加快 Gate 返回。
function buildNpcDeductionGateMessages(names, prompt) {
  const recentMessages = getRecentMessages(NPC_DEDUCTION_RECENT_COUNT);
  const namesText = JSON.stringify(names);
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        '以下被 <Registered_Characters>...</Registered_Characters> 包裹的是当前全部已注册角色名单，这是唯一的候选集。',
        '只从这份名单中挑选：名单之外的角色（即使出现在对话里）一律不列入。',
        `<Registered_Characters>\n${namesText}\n</Registered_Characters>`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `以下被 <Recent_Messages>...</Recent_Messages> 包裹的是当前场景的最新 ${NPC_DEDUCTION_RECENT_COUNT} 条消息（含各角色在场与不在场的段落）。`,
        '请据此逐个判断名单中的角色：谁本轮会开口、被直接点名、明显有戏份，或在场且受到本轮事件直接影响；',
        '若最后一条用户消息未点名任何人，以在场角色的情绪积累与行动意图为准；',
        '只是被提及、明确不在场或纯属背景的角色不要列入。',
        `<Recent_Messages>\n${JSON.stringify(recentMessages)}\n</Recent_Messages>`,
      ].join('\n'),
    },
    {
      role: 'user',
      content: `请按约定输出 JSON，只从名单中列出本轮会开口、行动或有重要内心反应的角色：\n\n${JSON.stringify({ characters: [] })}`,
    },
  ];
}

// 单角色推演请求体（v0.9.2 起）按「提示词 → 档案块 → 剧情块 → 输出契约」四段式组织：
// 1. system 角色扮演提示词；
// 2. user 档案段：引导消息 + <Character_Profile> 块（该角色档案，XML 包裹）；
// 3. user 剧情段：引导消息 + <Recent_Messages> 块（最近 4 条消息，XML 包裹）；
// 4. user 输出契约段：角色名 + 约定 JSON 模板。
// 按设计只提供「该角色档案 + 最近 4 条消息」：不带其他角色档案、不带世界书、不带完整聊天记录。
function buildNpcDeductionCharacterMessages(name, archive, prompt) {
  const recentMessages = getRecentMessages(NPC_DEDUCTION_RECENT_COUNT);
  const profileText = JSON.stringify(serializeArchiveForPrompt(archive), null, 2);
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        `以下被 <Character_Profile>...</Character_Profile> 包裹的是「${name}」的完整档案`,
        '（基本资料 + 性格 / 世界观 / 家庭背景 / 人际关系 / 记忆）。',
        '它是你扮演该角色的唯一身份依据，请据此维持设定一致；',
        '档案里的世界观记录的是 TA 已知或相信的世界规则，超出档案与剧情获知范围的信息对 TA 一律不可知。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `<Character_Profile>\n${profileText}\n</Character_Profile>`,
    },
    {
      role: 'user',
      content: [
        `以下被 <Recent_Messages>...</Recent_Messages> 包裹的是当前场景的最新 ${NPC_DEDUCTION_RECENT_COUNT} 条消息`,
        '（含该角色在场与不在场的段落）。',
        '请先判断该角色是否在场、听到了什么、看到了什么：只有 TA 亲历、被告知或当场目击的内容才是 TA 此刻知道的；',
        '不在场的对话对 TA 不可知，不得据此补全信息。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `<Recent_Messages>\n${JSON.stringify(recentMessages, null, 2)}\n</Recent_Messages>`,
    },
    {
      role: 'user',
      content: `请扮演「${name}」，以 TA 的第一人称写一段内心独白，按约定输出 JSON：\n\n${JSON.stringify({ character: name, monologue: '（该角色第一人称的内心独白）' }, null, 2)}`,
    },
  ];
}

// 解析单角色推演结果：{ character, monologue }；角色名必须与请求角色一致且
// monologue 非空才接受——模型乱格式 / 角色名不匹配 / 空独白一律视为该角色失败。
// 容错回退：模型未按契约输出 JSON、直接写了独白正文时，若正文不像拒答/说明则按正文回退，
// 避免「模型只是忘了包 JSON」导致整轮推演白跑。
function parseNpcDeductionMonologue(content, expectedName) {
  let parsed = null;
  try {
    parsed = parseAgentJson(content);
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (String(parsed.character || '').trim() === expectedName) {
      const monologue = String(parsed.monologue || '').trim();
      if (monologue) return monologue;
    }
    return null;
  }
  const text = String(content || '').trim();
  if (text && !looksLikeNonMonologue(text)) {
    logApp('debug', '角色推演结果非 JSON，已按正文回退', expectedName);
    return text;
  }
  return null;
}

// 容错回退的拒答/说明前缀：命中即视为非独白正文，不注入。
function looksLikeNonMonologue(text) {
  return /^(抱歉|对不起|很抱歉|我无法|我不能|拒绝|无法生成|无法继续|以下是)/.test(text);
}

// 拼接注入块：统一格式的 <NPC_Deduction> 文本，明确告知主模型这不是剧情正文，
// 并给出不可弃用的强制执行规则——消除「与设定冲突可弃用」「仅供参考」等让主模型跳过本块的漏洞。
function buildNpcDeductionInjectionText(results) {
  const lines = [
    '<NPC_Deduction>',
    '【系统导演注 · 强制指令】本块不是剧情正文，也不是任何角色的台词、旁白或可引用文本；它是系统在发送前依据角色档案与当前剧情，推演出的「各角色在接下来剧情中的真实内心状态与行动意图」。以下规则必须逐条执行，不得忽略、不得淡化，不得以任何理由整体弃用。',
    '',
    '执行规则：',
    '1. 直接驱动：各角色的行动与对白必须由 TA 独白中的心情、动机与「下一步行动」直接驱动，并在接下来的剧情中真实落地（对象、方式、时机都要兑现）；禁止敷衍带过、写与独白无关的日常，禁止停留在观望与等待。',
    '2. 必须外显：独白中的行动意图必须通过动作、神态、语气、话术或选择在接下来的回复中体现出来；每个注入角色至少有一个意图落地，漏演视为不合格。',
    '3. 禁止引用：独白是 TA 的内心，不是台词——不得复述、转述，也不得让角色念出本段任何原文，只能通过言行侧面体现。',
    '4. 角色隔离：每个角色的独白只属于 TA 自己，不得互相套用或张冠李戴。',
    '5. 冲突裁决：若独白与档案硬设定或已发生剧情冲突，保留其中的情绪与行动意图，改用符合设定与剧情的方式表达；不得整段弃用，也不得以「与设定不符」为由跳过本指令。',
    '6. 优先级：在接下来的剧情中，若与你对角色的一般印象或惯性理解冲突，以本段为准。',
    '',
  ];
  for (const result of results) {
    lines.push(`<character name="${result.name}">`);
    lines.push(String(result.monologue || '').trim());
    lines.push('</character>');
  }
  lines.push('</NPC_Deduction>');
  return lines.join('\n');
}

// 推演单个角色：独立 API 调用，失败只影响该角色。
async function deduceNpcCharacter(name, signal) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : null;
  const archive = roster?.[name];
  if (!ctx || !archive) return { status: 'skipped' };
  const settings = getSettings(ctx);
  const prompt = getPromptSavedText('roleplaySystem', ctx);
  if (!prompt) return { status: 'skipped' };
  const messages = buildNpcDeductionCharacterMessages(name, archive, prompt);
  const content = await chatCompletion(settings, messages, { signal });
  const monologue = parseNpcDeductionMonologue(content, name);
  if (!monologue) {
    logApp('warn', '角色推演结果无法解析', `${name} · 原文: ${String(content || '').slice(0, 400)}`);
    return { status: 'error' };
  }
  logApp('debug', '角色推演完成', name);
  return { status: 'ok', monologue };
}

// 单轮完整管线：Gate → 并发推演 → 注入。任何一步失败都按「降级放行」处理，
// 绝不让发送流程卡死；总耗时受 NPC_DEDUCTION_TIMEOUT_MS 硬截止。
async function runNpcDeductionPipeline(ctx, settings, names) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const deadline = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, NPC_DEDUCTION_TIMEOUT_MS);
  const record = {
    at: startedAt,
    durationMs: 0,
    gateTotal: names.length,
    gateSelected: [],
    gateRaw: '',
    okNames: [],
    failedNames: [],
    skippedNames: [],
    timedOut: false,
    injected: false,
    skipped: false,
  };
  let roundCharacters = [];
  let injectionText = '';
  const finish = (overrides = {}) => {
    clearTimeout(deadline);
    record.durationMs = Date.now() - startedAt;
    Object.assign(record, overrides);
    npcDeductionLastRound = {
      ...record,
      characters: roundCharacters,
      injectionText,
    };
    renderNpcDeductionToggle();
    refreshHomeRoundBadge();
    const activeView = document.querySelector('.soullink-view.is-active');
    if (activeView?.id === ROUND_VIEW_ID) renderRoundView();
  };
  try {
    globalThis.toastr?.info?.('角色预筛中…', `[${MODULE_NAME}]`);
    const gatePrompt = getPromptSavedText('roleplayPreScreen', ctx);
    if (!gatePrompt) {
      logApp('warn', '角色推演跳过：未找到「角色预筛」提示词');
      finish({ skipped: true });
      return;
    }
    logApp('info', '角色推演：Gate 预筛开始', `${names.length} 个已注册角色`);
    const gateMessages = buildNpcDeductionGateMessages(names, gatePrompt);
    // Gate 只产出角色名单，输出量小：限制 maxTokens 并降低 temperature，
    // 避免模型长篇输出拖慢发送前阻塞链路，同时保持判定确定性（与自动档案 Gate 一致）。
    const gateContent = await chatCompletion(settings, gateMessages, { signal: controller.signal, maxTokens: 1024, temperature: 0.1 });
    const selected = parseGateCharacterNames(parseAgentJson(gateContent), names);
    record.gateSelected = selected;
    record.gateRaw = String(gateContent || '').slice(0, 400);
    logApp('info', '角色推演：Gate 预筛完成', `入选 ${selected.length}/${names.length} 个角色`, selected);
    if (selected.length === 0) {
      logApp('warn', '角色推演：Gate 预筛 0 入选，原文', String(gateContent || '').slice(0, 400));
      globalThis.toastr?.info?.('预筛完成：本轮无角色有戏份，直接生成', `[${MODULE_NAME}]`);
      finish({ skipped: true });
      return;
    }
    globalThis.toastr?.info?.(`预筛完成：入选 ${selected.length}/${names.length} 个角色，开始角色扮演`, `[${MODULE_NAME}]`);
    const results = await Promise.allSettled(selected.map((name) => deduceNpcCharacter(name, controller.signal)));
    const succeeded = [];
    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      const name = selected[i];
      if (result.status === 'fulfilled' && result.value?.status === 'ok' && result.value.monologue) {
        record.okNames.push(name);
        roundCharacters.push({ name, monologue: result.value.monologue });
        succeeded.push({ name, monologue: result.value.monologue });
      } else if (result.status === 'fulfilled' && result.value?.status === 'skipped') {
        record.skippedNames.push(name);
      } else {
        record.failedNames.push(name);
      }
    }
    if (controller.signal.aborted) record.timedOut = true;
    if (succeeded.length === 0) {
      logApp('warn', '角色推演：全部失败，本轮不注入', { failed: record.failedNames, skipped: record.skippedNames });
      globalThis.toastr?.warning?.(
        `角色推演全部失败，本轮不注入（${record.failedNames.length} 失败 / ${record.skippedNames.length} 跳过${record.timedOut ? '，超时中止' : ''}）`,
        `[${MODULE_NAME}]`,
      );
      finish();
      return;
    }
    const api = getExtensionPromptApi(ctx);
    if (!api) {
      logApp('warn', '角色推演：宿主不支持提示词注入，跳过注入');
      globalThis.toastr?.warning?.('推演完成，但宿主不支持注入（setExtensionPrompt 不可用）', `[${MODULE_NAME}]`);
      finish();
      return;
    }
    injectionText = buildNpcDeductionInjectionText(succeeded);
    clearNpcDeductionInjection(ctx);
    api.setExtensionPrompt(NPC_DEDUCTION_INJECT_KEY, injectionText, api.inChat, 0, false, api.systemRole);
    record.injected = true;
    logApp('info', '角色推演：已注入提示词', `成功 ${record.okNames.length}/${selected.length} 个角色，位于最后一条用户消息下方`, record.okNames);
    globalThis.toastr?.success?.('角色扮演完成，已注入提示词！', `[${MODULE_NAME}]`);
    finish();
  } catch (error) {
    if (controller.signal.aborted) {
      record.timedOut = true;
      logApp('warn', '角色推演超时，直接放行发送', `${NPC_DEDUCTION_TIMEOUT_MS}ms`);
      globalThis.toastr?.warning?.('角色推演超时，已直接放行发送', `[${MODULE_NAME}]`);
    } else {
      const message = String(error?.message || error);
      logApp('error', '角色推演失败，直接放行发送', message);
      globalThis.toastr?.error?.(`角色推演失败，已直接放行：${message.slice(0, 160)}`, `[${MODULE_NAME}]`);
    }
    finish();
  }
}

// messageSent 阻塞监听器：返回 Promise，宿主 emit 会 await 它，
// 从而在推演注入完成前阻止主模型请求；所有分支都必须尽快 resolve。
async function onNpcDeductionMessageSent(...args) {
  const ctx = getContextSafe();
  if (!ctx) return;
  let settings;
  try {
    settings = getSettings(ctx);
  } catch (error) {
    console.warn(`[${MODULE_NAME}] 角色推演：读取设置失败`, error);
    return;
  }
  if (!settings.npDeductionEnabled) return;
  if (!getExtensionPromptApi(ctx)) {
    logApp('warn', '角色推演跳过：宿主不支持提示词注入');
    return;
  }
  const roster = getRoster(ctx);
  const names = Object.keys(roster || {});
  if (names.length === 0) return;
  if (!getApiBase(settings) || !String(settings.model || '').trim()) return;
  const chat = Array.isArray(ctx.chat) ? ctx.chat : [];
  const lastMessage = chat[chat.length - 1];
  // 只处理「用户点击发送」产生的新消息；系统消息 / 非用户末条一律放行。
  if (!lastMessage || !lastMessage.is_user) return;
  // 校验事件载荷与末条消息一致：其他插件自行 emit messageSent 时通常携带自己的
  // 文本（如 QuickReply 发送、自动回复脚本），与末条消息不一致即可判定为误触发；
  // 载荷非字符串（宿主格式差异）时无法校验，按原有逻辑放行。
  const eventText = typeof args?.[0] === 'string' ? String(args[0]).trim() : '';
  if (eventText && String(lastMessage.mes || '').trim() !== eventText) {
    logApp('debug', '角色推演跳过：messageSent 载荷与末条消息不一致（疑似其他插件触发）');
    return;
  }
  const signature = buildNpcDeductionSignature(lastMessage);
  if (npcDeductionState.running) {
    logApp('debug', '角色推演跳过：上一轮仍在运行（本轮内容已覆盖）');
    return;
  }
  if (npcDeductionState.lastSignature === signature) {
    logApp('debug', '角色推演跳过：同一发送已处理');
    return;
  }
  npcDeductionState.running = true;
  npcDeductionState.lastSignature = signature;
  try {
    await runNpcDeductionPipeline(ctx, settings, names);
  } finally {
    npcDeductionState.running = false;
    npcDeductionState.lastSignature = '';
  }
}

// 生成结束 / 停止后清空注入：保证 swipes / 重生成 / 后续轮次不会复用本轮的推演块。
function onNpcDeductionGenerationCleanup() {
  const ctx = getContextSafe();
  if (!ctx) return;
  if (!getExtensionPromptApi(ctx)) return;
  clearNpcDeductionInjection(ctx);
}

// messageSent 专用订阅：与 onHostEvent 不同，这里的监听器必须「返回 Promise」，
// 宿主 emit 才会等待它——这是「阻止立即请求主模型」的机制基础。
function installNpcDeductionMessageSentHook(ctx) {
  const eventSource = ctx?.eventSource;
  if (!eventSource || typeof eventSource.on !== 'function') return;
  const eventType = resolveHostEventType(ctx, 'messageSent');
  const previous = globalThis[NPC_MESSAGE_SENT_HANDLER_KEY];
  if (previous && typeof eventSource.removeListener === 'function') {
    eventSource.removeListener(eventType, previous);
    globalThis[NPC_MESSAGE_SENT_HANDLER_KEY] = null;
  }
  const wrapped = (...args) => {
    try {
      return onNpcDeductionMessageSent(...args).catch((error) => {
        console.error(`[${MODULE_NAME}] host event messageSent（角色推演）失败`, error);
      });
    } catch (error) {
      console.error(`[${MODULE_NAME}] host event messageSent（角色推演）失败`, error);
      return Promise.resolve();
    }
  };
  globalThis[NPC_MESSAGE_SENT_HANDLER_KEY] = wrapped;
  eventSource.on(eventType, wrapped);
}
