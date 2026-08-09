// ---------- 日志系统：捕获与存储 ----------
const CONSOLE_ORIGINALS = {};
// 热重载共享状态：脚本重新执行时，新旧实例共用同一份缓冲与暂停/序列状态，
// 保证「暂停」「继续」按钮与日志捕获管道永远指向同一份数据（热重载不丢状态）。
const LOG_STATE_KEY = '__soullinkLogState__';
const logState = globalThis[LOG_STATE_KEY] || (globalThis[LOG_STATE_KEY] = {
  entries: [],
  sequence: 0,
  paused: false,
  pausedCount: 0,
  pausedAtId: 0,
});
let logEntries = logState.entries;
let logMaxEntries = LOG_MAX_ENTRIES_DEFAULT;
let logAutoScroll = true;
let logLevelFilter = '';
let logSourceFilter = '';
let logConsoleNoise = true;
let logSearchQuery = '';
let logVisibleCount = 0;
let fullBodyCaptures = [];
let logStatsRafId = 0;
let logSearchTimer = null;

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function formatLogTime(timestamp) {
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

function safeStringify(value) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  try {
    const seen = new WeakSet();
    const text = JSON.stringify(value, (key, item) => {
      if (typeof item === 'bigint') return `${item}n`;
      if (item instanceof Error) return `[${item.name || 'Error'}: ${item.message}]`;
      if (typeof item === 'function') return '[function]';
      if (item && typeof item === 'object') {
        if (seen.has(item)) return '[circular]';
        seen.add(item);
      }
      return item;
    });
    return text === undefined ? String(value) : text;
  } catch {
    return String(value);
  }
}

function argToText(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name || 'Error'}: ${arg.message}`;
  if (arg && typeof arg === 'object' && arg.nodeType === 1) return `<${String(arg.tagName || 'element').toLowerCase()}>`;
  if (typeof arg === 'symbol') return String(arg);
  const text = safeStringify(arg);
  return text.length > 800 ? `${text.slice(0, 800)}…(截断)` : text;
}

function buildLogMessage(args) {
  const parts = [];
  for (const arg of args) {
    try {
      parts.push(argToText(arg));
    } catch {
      parts.push('[unserializable]');
    }
  }
  const message = parts.join(' ');
  return message.length > 4000 ? `${message.slice(0, 4000)}…(截断)` : message;
}

function pushLogEntry(level, source, args, detail) {
  try {
    const safeLevel = LOG_LEVELS.includes(level) ? level : 'info';
    const timestamp = Date.now();
    const entry = {
      id: ++logState.sequence,
      ts: timestamp,
      time: formatLogTime(timestamp),
      level: safeLevel,
      source: String(source || 'app').slice(0, 24),
      message: redactSensitive(buildLogMessage(Array.isArray(args) ? args : [args])),
    };
    if (detail) entry.detail = redactSensitive(String(detail)).slice(0, LOG_DETAIL_CAP);
    // 噪音过滤：Tavern 内部刷屏（世界书扫描 / 宏变量 dump / 正则跳过 / 事件总线 / 元数据保存 / 非模型 IPC）。
    // 注意：真实环境里 [WI] / [Prompt Template] 常以 info 级别输出，只过滤 debug 会漏网，故 debug+info 都过滤；
    // warn/error 永不误伤。
    if (logConsoleNoise) {
      if (source === 'console' && (safeLevel === 'debug' || safeLevel === 'info')
        && LOG_NOISE_PREFIXES.some((prefix) => entry.message.startsWith(prefix))) return;
      if (source === 'network' && safeLevel === 'debug'
        && NETWORK_NOISE_PATTERNS.some((pattern) => pattern.test(entry.message))) return;
      // 宿主扩展更新检查的已知报错（error 级，见 constants 注释）：按内容精确匹配，不误伤其他 error。
      if (ERROR_NOISE_PATTERNS.some((pattern) => pattern.test(entry.message))) return;
    }
    // 连续重复折叠：同一级别/来源/内容紧挨着出现时，只更新最后一条的计数与时间
    const last = logEntries[logEntries.length - 1];
    if (last && last.level === entry.level && last.source === entry.source
      && last.message === entry.message && (last.detail || '') === (entry.detail || '')) {
      last.repeat = (last.repeat || 1) + 1;
      last.ts = timestamp;
      last.time = entry.time;
      if (logState.paused) logState.pausedCount += 1;
      refreshLastLogRow();
      scheduleLogStats();
      return;
    }
    logEntries.push(entry);
    if (logEntries.length > logMaxEntries) logEntries.splice(0, logEntries.length - logMaxEntries);
    if (logState.paused) logState.pausedCount += 1;
    appendLiveLogEntry(logEntries[logEntries.length - 1]);
    scheduleLogStats();
  } catch (error) {
    try {
      CONSOLE_ORIGINALS.error?.apply(globalThis.console, ['[SoulLink] 日志捕获失败', error]);
    } catch {}
  }
}

function logApp(level, ...args) {
  pushLogEntry(level, 'soulink', args);
  const method = level === 'info' ? 'log' : level;
  const original = CONSOLE_ORIGINALS[method] || CONSOLE_ORIGINALS.log;
  try {
    if (original) original.apply(globalThis.console, [`[${MODULE_NAME}]`, ...args]);
  } catch {}
}

function initLogCapture() {
  if (typeof globalThis.window === 'undefined') return;
  try {
    const state = globalThis[LOG_CAPTURE_KEY] || (globalThis[LOG_CAPTURE_KEY] = { handlers: [], originals: {} });
    if (state.handlers.length === 0) {
      ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
        const original = globalThis.console?.[method]?.bind?.(globalThis.console);
        if (typeof original !== 'function') return;
        state.originals[method] = original;
        globalThis.console[method] = (...args) => {
          try {
            (state.originals[method] || globalThis.console[method])(...args);
          } catch {}
          for (const handler of state.handlers) {
            try {
              handler(method === 'log' ? 'info' : method, 'console', args);
            } catch {}
          }
        };
      });
      globalThis.window.addEventListener('error', (event) => {
        const where = event?.filename ? ` @ ${event.filename}${event.lineno ? `:${event.lineno}` : ''}` : '';
        for (const handler of state.handlers) {
          try {
            handler('error', 'window', [String(event?.message || '未知错误') + where]);
          } catch {}
        }
      });
      globalThis.window.addEventListener('unhandledrejection', (event) => {
        for (const handler of state.handlers) {
          try {
            handler('error', 'promise', [event?.reason ?? '未捕获的 Promise 拒绝']);
          } catch {}
        }
      });
    }
    // 热重载（扩展脚本重新执行）时，沿用已有的 console 包装与窗口监听，
    // 只把捕获目标换成当前实例的 pushLogEntry，日志不中断、不重复包装。
    state.handlers = [pushLogEntry];
    for (const method of Object.keys(state.originals)) {
      if (!CONSOLE_ORIGINALS[method]) CONSOLE_ORIGINALS[method] = state.originals[method];
    }
  } catch (error) {
    try {
      globalThis.console?.error?.('[SoulLink] 日志捕获初始化失败', error);
    } catch {}
  }
}

function initHostEventLogging() {
  const ctx = getContextSafe();
  const eventSource = ctx?.eventSource;
  if (!eventSource || typeof eventSource.on !== 'function') return;
  const wrappers = globalThis[LOG_EVENT_LOG_KEY] || (globalThis[LOG_EVENT_LOG_KEY] = {});
  for (const eventName of HOST_EVENTS_TO_LOG) {
    const eventType = resolveHostEventType(ctx, eventName);
    const previous = wrappers[eventName];
    if (previous && typeof eventSource.removeListener === 'function') {
      eventSource.removeListener(eventType, previous);
    }
    const wrapped = (...args) => pushLogEntry('debug', 'event', [`[${eventName}]`, ...args]);
    wrappers[eventName] = wrapped;
    eventSource.on(eventType, wrapped);
  }
}

// ---------- 日志系统：网络请求捕获 ----------
function redactSensitive(text) {
  return String(text || '')
    .replace(/("(?:api[_-]?key|zapikey|key|password|proxy_password|authorization|token)"\s*:\s*")[^"]*(")/gi, '$1***$2')
    .replace(/(Authorization:\s*Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1***')
    .replace(/\b(sk-[A-Za-z0-9_-]{12,})\b/g, 'sk-***')
    .replace(/\b(tauri-invoke-key:\s*)[^\s]+/gi, '$1***');
}

function prettyJsonOrRaw(text, cap) {
  const trimmed = String(text || '');
  if (!trimmed) return '(无)';
  try {
    const parsed = JSON.parse(trimmed);
    const pretty = JSON.stringify(parsed, null, 2);
    return pretty.length > cap ? `${pretty.slice(0, cap)}…(截断)` : pretty;
  } catch {
    return trimmed.length > cap ? `${trimmed.slice(0, cap)}…(截断)` : trimmed;
  }
}

function formatHeadersForLog(headers) {
  try {
    const normalized = new Headers(headers || {});
    const lines = [];
    normalized.forEach((value, key) => {
      const lower = key.toLowerCase();
      const redacted = /authorization|api[_-]?key|password|proxy_password|token|cookie|invoke/i.test(lower) ? '***' : value;
      lines.push(`${key}: ${redacted}`);
    });
    return lines.join('\n') || '(无)';
  } catch {
    return '(无法读取)';
  }
}

function formatBodyForLog(body) {
  if (body === undefined || body === null) return '(无)';
  if (typeof body === 'string') return redactSensitive(prettyJsonOrRaw(body, LOG_REQUEST_BODY_CAP));
  if (body instanceof URLSearchParams) return redactSensitive(String(body).slice(0, LOG_REQUEST_BODY_CAP));
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const lines = [];
    body.forEach((value, key) => {
      const text = typeof value === 'string' ? value : `[File ${value.name || '?'} ${value.size || '?'}B]`;
      lines.push(`${key}: ${/key|password|token/i.test(key) ? '***' : text}`);
    });
    return lines.join('\n') || '(空)';
  }
  if (body instanceof Blob) return `[Blob ${body.size} 字节]`;
  if (body instanceof ArrayBuffer) return `[ArrayBuffer ${body.byteLength} 字节]`;
  if (body instanceof ReadableStream) return '[ReadableStream]';
  return `[${Object.prototype.toString.call(body)}]`;
}

async function readStreamText(stream, cap) {
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (text.length < cap) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    if (text.length >= cap) {
      try {
        await reader.cancel();
      } catch {}
      text = `${text.slice(0, cap)}…(截断)`;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
  return text;
}

function isChatCompletionUrl(url) {
  return /chat-completions|generate_chat_completion/i.test(String(url || ''));
}

async function readStreamFully(stream) {
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
  return text;
}

function pushFullBodyCapture(capture) {
  fullBodyCaptures.push(capture);
  if (fullBodyCaptures.length > LOG_FULL_BODY_MAX) fullBodyCaptures.splice(0, fullBodyCaptures.length - LOG_FULL_BODY_MAX);
  pushLogEntry('debug', 'network', ['完整请求体已捕获', `${capture.method} ${capture.url}`]);
}

async function describeFetchRequest(args) {
  const [input, init] = args;
  let url = '';
  let method = 'GET';
  let headers = null;
  let bodyText = '(无)';
  let fullBody = '';
  if (input instanceof Request) {
    url = input.url;
    method = input.method || 'GET';
    headers = input.headers;
    try {
      const clone = input.clone();
      const rawBody = await readStreamText(clone.body, LOG_REQUEST_BODY_CAP);
      bodyText = rawBody ? redactSensitive(prettyJsonOrRaw(rawBody, LOG_REQUEST_BODY_CAP)) : '(无)';
      if (isChatCompletionUrl(url)) {
        const fullClone = input.clone();
        fullBody = redactSensitive(await readStreamFully(fullClone.body));
      }
    } catch {
      bodyText = '(请求体已消费，无法读取)';
    }
  } else {
    url = String(input);
    method = String(init?.method || 'GET').toUpperCase();
    headers = init?.headers || null;
    bodyText = formatBodyForLog(init?.body);
    if (isChatCompletionUrl(url)) {
      fullBody = redactSensitive(prettyJsonOrRaw(String(init?.body ?? ''), Number.MAX_SAFE_INTEGER));
    }
  }
  return {
    url,
    method,
    fullBody,
    detail: `请求头:\n${formatHeadersForLog(headers)}\n请求体:\n${bodyText}`,
  };
}

async function readResponseBodyForLog(response, url) {
  try {
    const cappedClone = response.clone();
    let capped = '';
    let full = '';
    // 对话接口的响应体直接从同一个 clone 完整读完（再截断出展示文本），
    // 避免二次 clone 在 fetchText 已消费原始响应体后抛错、把已读到的内容一起丢掉
    // （旧实现因此把有内容的响应也记成「(空)」，误导排查）。
    if (isChatCompletionUrl(url)) {
      full = redactSensitive(await readStreamFully(cappedClone.body));
      capped = full.length > LOG_RESPONSE_BODY_CAP ? `${full.slice(0, LOG_RESPONSE_BODY_CAP)}…(截断)` : full;
    } else {
      capped = await readStreamText(cappedClone.body, LOG_RESPONSE_BODY_CAP);
    }
    return { capped, full };
  } catch {
    return { capped: '', full: '' };
  }
}

function handleNetworkEvent(event) {
  try {
    if (event.kind === 'request') {
      pushLogEntry('debug', 'network', [`${event.method} ${event.url}`], event.detail);
      return;
    }
    if (event.kind === 'error') {
      pushLogEntry('error', 'network', [`请求失败 ${event.method} ${event.url}`, String(event.error?.message || event.error)], event.detail);
      return;
    }
    const { response, method, url, detail, fullBody, startedAt } = event;
    const duration = Date.now() - startedAt;
    const level = response.status >= 500 ? 'error' : (response.status >= 400 ? 'warn' : 'debug');
    const message = `${response.status} ${method} ${url} · ${duration}ms`;
    readResponseBodyForLog(response, url)
      .then(({ capped, full }) => {
        pushLogEntry(level, 'network', [message], `${detail}\n\n响应头:\n${formatHeadersForLog(response.headers)}\n响应体:\n${redactSensitive(capped) || '(空)'}`);
        if (fullBody || full) {
          pushFullBodyCapture({ url, method, requestBody: fullBody, responseBody: full, at: new Date().toISOString() });
        }
      })
      .catch(() => {
        pushLogEntry(level, 'network', [message], `${detail}\n\n响应体: (读取失败)`);
      });
  } catch (error) {
    try {
      CONSOLE_ORIGINALS.error?.apply(globalThis.console, ['[SoulLink] 网络日志处理失败', error]);
    } catch {}
  }
}

function initNetworkCapture() {
  if (typeof globalThis.window === 'undefined') return;
  try {
    const state = globalThis[NETWORK_CAPTURE_KEY] || (globalThis[NETWORK_CAPTURE_KEY] = { handlers: [], original: null });
    if (!state.original && typeof globalThis.fetch === 'function') {
      state.original = globalThis.fetch.bind(globalThis);
      globalThis.fetch = async (...args) => {
        const requestInfo = await describeFetchRequest(args);
        const startedAt = Date.now();
        for (const handler of state.handlers) {
          try {
            handler({ kind: 'request', ...requestInfo, startedAt });
          } catch {}
        }
        let response;
        try {
          response = await state.original(...args);
        } catch (error) {
          for (const handler of state.handlers) {
            try {
              handler({ kind: 'error', ...requestInfo, error, startedAt });
            } catch {}
          }
          throw error;
        }
        for (const handler of state.handlers) {
          try {
            handler({ kind: 'response', ...requestInfo, response, startedAt });
          } catch {}
        }
        return response;
      };
    }
    // 热重载时沿用已安装的 fetch 包装，只替换捕获目标。
    state.handlers = [handleNetworkEvent];
  } catch (error) {
    try {
      globalThis.console?.error?.('[SoulLink] 网络日志捕获初始化失败', error);
    } catch {}
  }
}
function scheduleFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') return globalThis.requestAnimationFrame(callback);
  return setTimeout(callback, 16);
}

function entryMatchesLog(entry) {
  if (logLevelFilter && entry.level !== logLevelFilter) return false;
  if (logSourceFilter && entry.source !== logSourceFilter) return false;
  const query = logSearchQuery.trim().toLowerCase();
  if (!query) return true;
  return `${entry.time} ${entry.level} ${entry.source} ${entry.message} ${entry.detail || ''}`.toLowerCase().includes(query);
}

function getVisibleLogEntries() {
  // 暂停时只渲染暂停时刻之前的快照：暂停期间缓冲的新日志不会因过滤/搜索/重开视图泄漏到列表
  const base = logState.paused && logState.pausedAtId > 0
    ? logEntries.filter((entry) => entry.id <= logState.pausedAtId)
    : logEntries;
  return base.filter(entryMatchesLog);
}

function createLogRow(entry) {
  const row = document.createElement('div');
  row.className = `soullink-log__row soullink-log__row--${entry.level}`;
  row.title = '点击展开 / 收起完整内容';
  const time = document.createElement('span');
  time.className = 'soullink-log__time';
  time.textContent = entry.time;
  const level = document.createElement('span');
  level.className = 'soullink-log__level';
  level.textContent = entry.level;
  const source = document.createElement('span');
  source.className = 'soullink-log__source';
  source.textContent = entry.source;
  source.title = `来源: ${entry.source}`;
  const text = document.createElement('span');
  text.className = 'soullink-log__text';
  text.textContent = entry.message;
  text.title = entry.message;
  row.dataset.id = String(entry.id);
  row.append(time, level, source, text);
  if (entry.detail) {
    const detail = document.createElement('pre');
    detail.className = 'soullink-log__detail';
    detail.textContent = entry.detail;
    row.appendChild(detail);
  }
  if (entry.repeat > 1) {
    const repeat = document.createElement('span');
    repeat.className = 'soullink-log__repeat';
    repeat.textContent = `×${entry.repeat}`;
    repeat.title = `同一内容连续出现 ${entry.repeat} 次`;
    row.appendChild(repeat);
  }
  row.addEventListener('click', () => row.classList.toggle('is-expanded'));
  return row;
}

function scrollLogToBottom(list) {
  if (!list) return;
  list.scrollTop = list.scrollHeight;
}

function isLogAtBottom(list) {
  return list.scrollHeight - list.scrollTop - list.clientHeight < 24;
}

function syncLogNote(list) {
  if (!list) return;
  if (logVisibleCount <= LOG_RENDER_CAP) {
    list.querySelector('.soullink-log__note')?.remove();
    return;
  }
  let note = list.querySelector('.soullink-log__note');
  if (!note) {
    note = document.createElement('div');
    note.className = 'soullink-log__note';
    list.insertBefore(note, list.firstChild);
  }
  note.textContent = `仅显示最近 ${LOG_RENDER_CAP} 条 · 共 ${logVisibleCount} 条`;
}

function updateLogBackButton() {
  const list = document.getElementById(LOG_LIST_ID);
  const back = document.getElementById(LOG_BACK_ID);
  if (!list || !back) return;
  back.hidden = isLogAtBottom(list);
}

function renderLogList() {
  const list = document.getElementById(LOG_LIST_ID);
  if (!list) return;
  list.textContent = '';
  const entries = getVisibleLogEntries();
  logVisibleCount = entries.length;
  const slice = entries.slice(-LOG_RENDER_CAP);
  const fragment = document.createDocumentFragment();
  for (const entry of slice) fragment.appendChild(createLogRow(entry));
  list.appendChild(fragment);
  syncLogNote(list);
  if (entries.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-log__empty';
    empty.textContent = '暂无日志 —— 后台日志会自动记录到这里。';
    list.appendChild(empty);
  }
  scrollLogToBottom(list);
  updateLogBackButton();
}

function refreshLastLogRow() {
  const list = document.getElementById(LOG_LIST_ID);
  const view = document.getElementById(LOG_VIEW_ID);
  const entry = logEntries[logEntries.length - 1];
  if (!list || !view || !entry || !view.classList.contains('is-active') || logState.paused) return;
  const lastRow = list.querySelector('.soullink-log__row:last-child');
  if (!lastRow || lastRow.dataset.id !== String(entry.id)) return;
  const timeEl = lastRow.querySelector('.soullink-log__time');
  if (timeEl) timeEl.textContent = entry.time;
  let badge = lastRow.querySelector('.soullink-log__repeat');
  if (entry.repeat > 1) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'soullink-log__repeat';
      lastRow.appendChild(badge);
    }
    badge.textContent = `×${entry.repeat}`;
    badge.title = `同一内容连续出现 ${entry.repeat} 次`;
  } else if (badge) {
    badge.remove();
  }
}

function appendLiveLogEntry(entry) {
  const list = document.getElementById(LOG_LIST_ID);
  const view = document.getElementById(LOG_VIEW_ID);
  if (!list || !view || !entry) return;
  if (!view.classList.contains('is-active') || logState.paused) return;
  if (!entryMatchesLog(entry)) return;
  // 跟随开启 = 钉在底部：无论当前滚动位置，新日志一律滚到底部显示最新
  const shouldFollow = logAutoScroll;
  list.querySelector('.soullink-log__empty')?.remove();
  list.appendChild(createLogRow(entry));
  logVisibleCount += 1;
  let rowCount = list.querySelectorAll('.soullink-log__row').length;
  while (rowCount > LOG_RENDER_CAP) {
    const firstRow = list.querySelector('.soullink-log__row');
    if (!firstRow) break;
    firstRow.remove();
    rowCount -= 1;
  }
  syncLogNote(list);
  if (shouldFollow) scrollLogToBottom(list);
  updateLogBackButton();
}

function updateLogStats() {
  const counts = { debug: 0, info: 0, warn: 0, error: 0 };
  for (const entry of logEntries) counts[entry.level] = (counts[entry.level] || 0) + 1;
  const total = logEntries.length;
  document.querySelectorAll('.soullink-log__chip-count').forEach((node) => {
    const level = node.dataset.level || '';
    node.textContent = level ? counts[level] || 0 : total;
  });
  const status = document.getElementById(LOG_STATUS_ID);
  if (status) status.textContent = `共 ${total} 条`;
  const paused = document.getElementById(LOG_PAUSED_ID);
  if (paused) {
    paused.hidden = !logState.paused;
    if (logState.paused) paused.textContent = `已暂停 · 新增 +${logState.pausedCount}`;
  }
  logVisibleCount = getVisibleLogEntries().length;
  syncLogNote(document.getElementById(LOG_LIST_ID));
}

function scheduleLogStats() {
  if (logStatsRafId) return;
  logStatsRafId = scheduleFrame(() => {
    logStatsRafId = 0;
    try {
      updateLogStats();
    } catch {}
  });
}

function buildLogExportText() {
  return `${logEntries
    .map((entry) => {
      const suffix = entry.repeat > 1 ? ` (×${entry.repeat})` : '';
      const line = `${entry.time} [${entry.level}] (${entry.source}) ${entry.message}${suffix}`;
      if (!entry.detail) return line;
      return `${line}\n${entry.detail.split('\n').map((detailLine) => `  ${detailLine}`).join('\n')}`;
    })
    .join('\n')}\n`;
}

// ---------- 日志系统：视图 UI ----------
function initLogView(panel) {
  if (!panel || panel.dataset.logReady === 'true') return;
  const getCtx = () => getContextSafe();

  const refreshPrefs = () => {
    const ctx = getCtx();
    const settings = ctx ? getSettings(ctx) : null;
    if (!settings) return;
    logMaxEntries = clampInt(settings.logMaxEntries, 100, 20000, LOG_MAX_ENTRIES_DEFAULT);
    logAutoScroll = settings.logAutoScroll !== false;
    logConsoleNoise = settings.logConsoleNoise !== false;
  };
  refreshPrefs();

  const autoscroll = document.getElementById(LOG_AUTOSCROLL_ID);
  if (autoscroll) autoscroll.classList.toggle('is-active', logAutoScroll);

  const noiseToggle = document.getElementById(LOG_NOISE_ID);
  if (noiseToggle) noiseToggle.classList.toggle('is-active', logConsoleNoise);
  noiseToggle?.addEventListener('click', () => {
    logConsoleNoise = !logConsoleNoise;
    noiseToggle.classList.toggle('is-active', logConsoleNoise);
    noiseToggle.title = logConsoleNoise ? '过滤已知噪音（世界书扫描 / 宏变量 dump / 正则跳过 / 事件总线 / 内部保存 / 非模型网络调用 / 宿主扩展更新检查报错）' : '不过滤噪音（显示全部 console 与网络日志）';
    const ctx = getCtx();
    if (ctx) {
      getSettings(ctx).logConsoleNoise = logConsoleNoise;
      saveSettings(ctx);
    }
    renderLogList();
    updateLogStats();
  });

  panel.querySelectorAll('.soullink-log__chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      logLevelFilter = chip.dataset.level || '';
      panel.querySelectorAll('.soullink-log__chip').forEach((node) => node.classList.toggle('is-active', node === chip));
      renderLogList();
      updateLogStats();
    }),
  );

  const search = document.getElementById(LOG_SEARCH_ID);
  search?.addEventListener('input', () => {
    clearTimeout(logSearchTimer);
    logSearchTimer = setTimeout(() => {
      logSearchQuery = String(search.value || '').trim();
      renderLogList();
      updateLogStats();
    }, LOG_SEARCH_DEBOUNCE_MS);
  });

  document.getElementById(LOG_PAUSE_ID)?.addEventListener('click', () => {
    logState.paused = !logState.paused;
    logState.pausedCount = 0;
    if (logState.paused) {
      // 记录暂停时刻的可见边界：暂停期间的新日志只入内存，恢复后一次性显示
      logState.pausedAtId = logEntries.length ? logEntries[logEntries.length - 1].id : 0;
    } else {
      logState.pausedAtId = 0;
      renderLogList();
    }
    const pause = document.getElementById(LOG_PAUSE_ID);
    if (pause) {
      pause.textContent = logState.paused ? '▶ 继续' : '⏸ 暂停';
      pause.classList.toggle('is-active', logState.paused);
      pause.title = logState.paused
        ? '已暂停：新日志先缓存（+N），不追加到列表；点「继续」一次性显示'
        : '暂停：新日志先缓存（+N），不再追加到列表';
    }
    updateLogStats();
  });

  autoscroll?.addEventListener('click', () => {
    logAutoScroll = !logAutoScroll;
    autoscroll.classList.toggle('is-active', logAutoScroll);
    autoscroll.title = logAutoScroll
      ? '跟随：钉在底部，新日志自动滚到底部（点一下关闭）'
      : '已停止跟随：新日志仍追加，但不再自动滚动';
    if (logAutoScroll) scrollLogToBottom(document.getElementById(LOG_LIST_ID));
    const ctx = getCtx();
    if (ctx) {
      getSettings(ctx).logAutoScroll = logAutoScroll;
      saveSettings(ctx);
    }
  });


  const sourceSelect = document.getElementById(LOG_SOURCE_ID);
  sourceSelect?.addEventListener('change', () => {
    logSourceFilter = sourceSelect.value || '';
    renderLogList();
    updateLogStats();
  });

  const maxSelect = document.getElementById(LOG_MAX_ID);
  if (maxSelect) {
    if (![...maxSelect.options].some((option) => option.value === String(logMaxEntries))) {
      const customOption = document.createElement('option');
      customOption.value = String(logMaxEntries);
      customOption.textContent = `${logMaxEntries} 条`;
      maxSelect.appendChild(customOption);
    }
    maxSelect.value = String(logMaxEntries);
    maxSelect.addEventListener('change', () => {
      logMaxEntries = clampInt(maxSelect.value, 100, 20000, LOG_MAX_ENTRIES_DEFAULT);
      if (logEntries.length > logMaxEntries) logEntries.splice(0, logEntries.length - logMaxEntries);
      const ctx = getCtx();
      if (ctx) {
        getSettings(ctx).logMaxEntries = logMaxEntries;
        saveSettings(ctx);
      }
      renderLogList();
      updateLogStats();
    });
  }

  document.getElementById(LOG_CLEAR_ID)?.addEventListener('click', () => {
    logEntries.length = 0;
    logState.pausedCount = 0;
    logState.pausedAtId = 0;
    renderLogList();
    updateLogStats();
    globalThis.toastr?.info?.('日志已清空', `[${MODULE_NAME}]`);
  });

  document.getElementById(LOG_COPY_ID)?.addEventListener('click', async () => {
    const text = buildLogExportText();
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
      globalThis.toastr?.success?.(`已复制 ${logEntries.length} 条日志`, `[${MODULE_NAME}]`);
    } catch (error) {
      globalThis.toastr?.error?.(`日志复制失败：${error?.message || error}`, `[${MODULE_NAME}]`);
    }
  });

  document.getElementById(LOG_EXPORT_ID)?.addEventListener('click', () => {
    const payload = {
      app: MODULE_NAME,
      version: MODULE_VERSION,
      exportedAt: new Date().toISOString(),
      count: logEntries.length,
      entries: logEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `soullink-log-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (logEntries.length === 0) {
      globalThis.toastr?.warning?.('暂无日志可导出', `[${MODULE_NAME}]`);
    } else {
      globalThis.toastr?.success?.(`已导出 ${logEntries.length} 条日志（JSON 文件）`, `[${MODULE_NAME}]`);
    }
  });

  document.getElementById(LOG_FULL_BODY_EXPORT_ID)?.addEventListener('click', () => {
    const payload = {
      app: MODULE_NAME,
      version: MODULE_VERSION,
      exportedAt: new Date().toISOString(),
      count: fullBodyCaptures.length,
      captures: fullBodyCaptures,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `soullink-fullbody-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (fullBodyCaptures.length === 0) {
      globalThis.toastr?.warning?.('暂无完整请求体可导出（触发一次对话请求后自动捕获）', `[${MODULE_NAME}]`);
    } else {
      globalThis.toastr?.success?.(`已导出最近 ${fullBodyCaptures.length} 次完整请求体（JSON 文件）`, `[${MODULE_NAME}]`);
    }
  });

  const list = document.getElementById(LOG_LIST_ID);
  list?.addEventListener('scroll', () => updateLogBackButton());
  document.getElementById(LOG_BACK_ID)?.addEventListener('click', () => {
    if (list) scrollLogToBottom(list);
    updateLogBackButton();
  });

  renderLogList();
  updateLogStats();
  panel.dataset.logReady = 'true';
  logApp('info', `日志系统已就绪（内存保留 ${logMaxEntries} 条）`);
}

// ---------- 日志系统：对外 API ----------
function exposeLogApi() {
  // 每次脚本（重新）执行都整体重建 API，保证热重载后仍指向当前实例的缓冲。
  globalThis.SoulLinkLog = {
    debug: (...args) => pushLogEntry('debug', 'external', args),
    info: (...args) => pushLogEntry('info', 'external', args),
    warn: (...args) => pushLogEntry('warn', 'external', args),
    error: (...args) => pushLogEntry('error', 'external', args),
    log: (...args) => pushLogEntry('info', 'external', args),
    clear: () => {
      logEntries.length = 0;
      logState.pausedCount = 0;
      logState.pausedAtId = 0;
      renderLogList();
      updateLogStats();
    },
    getEntries: () => logEntries.slice(),
    setMaxEntries: (count) => {
      logMaxEntries = clampInt(count, 100, 20000, LOG_MAX_ENTRIES_DEFAULT);
      if (logEntries.length > logMaxEntries) logEntries.splice(0, logEntries.length - logMaxEntries);
      const ctx = getContextSafe();
      if (ctx) {
        getSettings(ctx).logMaxEntries = logMaxEntries;
        saveSettings(ctx);
      }
      const select = document.getElementById(LOG_MAX_ID);
      if (select) select.value = String(logMaxEntries);
      renderLogList();
      updateLogStats();
    },
  };
}

// ---------- 日志系统：启动捕获（热重载安全） ----------
initLogCapture();
exposeLogApi();
initNetworkCapture();
