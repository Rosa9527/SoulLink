const MODULE_NAME = 'SoulLink';
const MODULE_VERSION = '0.5.0';

const PANEL_ID = 'soullink-panel';
const SPHERE_ID = 'soullink-floating-sphere';
const MENU_ITEM_ID = 'soullink-menu-item';
const MENU_API_ID = 'soullink-menu-api';
const MENU_ICON_CLASS = 'fa-solid fa-link';
const LOG_ICON_CLASS = 'fa-solid fa-scroll';
const PANEL_TITLE_ID = 'soullink-panel-title';
const PANEL_BACK_ID = 'soullink-panel-back';
const HOME_VIEW_ID = 'soullink-home-view';
const API_VIEW_ID = 'soullink-api-view';
const LOG_VIEW_ID = 'soullink-log-view';
const HOME_API_CARD_ID = 'soullink-home-api-card';
const HOME_LOG_CARD_ID = 'soullink-home-log-card';
const HOME_API_STATUS_ID = 'soullink-home-api-status';
const API_STATUS_ID = 'soullink-api-status';
const API_URL_ID = 'soullink-api-url';
const API_KEY_ID = 'soullink-api-key';
const API_KEY_TOGGLE_ID = 'soullink-api-key-toggle';
const API_CONNECT_ID = 'soullink-api-connect';
const API_MODEL_LIST_ID = 'soullink-api-model-list';
const API_MODEL_ID = 'soullink-api-model';
const HOME_LOG_STATUS_ID = 'soullink-home-log-status';
const LOG_SEARCH_ID = 'soullink-log-search';
const LOG_MAX_ID = 'soullink-log-max';
const LOG_PAUSE_ID = 'soullink-log-pause';
const LOG_AUTOSCROLL_ID = 'soullink-log-autoscroll';
const LOG_CLEAR_ID = 'soullink-log-clear';
const LOG_COPY_ID = 'soullink-log-copy';
const LOG_EXPORT_ID = 'soullink-log-export';
const LOG_LIST_ID = 'soullink-log-list';
const LOG_BACK_ID = 'soullink-log-back-to-latest';
const LOG_STATUS_ID = 'soullink-log-status';
const LOG_PAUSED_ID = 'soullink-log-paused-badge';

const SPHERE_POSITION_KEY = `${MODULE_NAME}_floating_sphere_position`;
const SPHERE_DRAG_THRESHOLD = 8;
const SPHERE_LONG_PRESS_MS = 650;
const SPHERE_SIZE = 56;
const EDGE_GAP = 24;
const MENU_RETRY_COUNT = 40;
const BOOTSTRAP_RETRY_COUNT = 60;
const DEFAULT_API_TIMEOUT_MS = 30000;
const MODEL_LIST_TIMEOUT_MS = 20000;
const LOG_MAX_ENTRIES_DEFAULT = 2000;
const LOG_RENDER_CAP = 1000;
const LOG_SEARCH_DEBOUNCE_MS = 120;
const LOG_LEVELS = Object.freeze(['debug', 'info', 'warn', 'error']);
const HOST_EVENTS_TO_LOG = Object.freeze([
  'appReady',
  'extensionsLoaded',
  'settingsLoaded',
  'chatChanged',
  'groupSelected',
  'messageSent',
  'messageReceived',
  'streamStarted',
  'streamEnded',
  'generationStarted',
  'generationEnded',
  'onlineStatusChanged',
]);

const BOOTSTRAP_RUNTIME_KEY = '__soullink_bootstrapped__';
const MENU_RECOVERY_OBSERVER_KEY = '__soullink_menu_recovery_observer__';
const APP_READY_HANDLER_KEY = '__soullink_app_ready_handler__';
const ESC_KEY_HANDLER_KEY = '__soullink_esc_key_handler__';
const LOG_CAPTURE_KEY = '__soullink_log_capture__';
const LOG_EVENT_LOG_KEY = '__soullink_log_event_handler__';

const DEFAULT_SETTINGS = Object.freeze({
  apiUrl: '',
  apiKey: '',
  model: '',
  modelOptions: [],
  logMaxEntries: LOG_MAX_ENTRIES_DEFAULT,
  logAutoScroll: true,
});

const FALLBACK_SETTINGS_STORE = new WeakMap();

function cloneValue(value) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function getHostExtensionSettings(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  try {
    if (!ctx.extensionSettings || typeof ctx.extensionSettings !== 'object') {
      ctx.extensionSettings = {};
      // 普通脚本是非严格模式，对冻结对象赋值不会抛错而是静默失败；
      // 这里显式复核，失败时抛给下方 catch 走 WeakMap 兜底。
      if (!ctx.extensionSettings || typeof ctx.extensionSettings !== 'object') {
        throw new TypeError('host context is not extensible');
      }
    }
    return ctx.extensionSettings;
  } catch (error) {
    // 某些宿主（如 TauriTavern）的 context 可能是冻结/不可扩展对象，直接赋值会抛
    // TypeError。回退到模块级 WeakMap 存储，保证设置读写不中断。
    console.warn(`[${MODULE_NAME}] host context is not extensible; using fallback settings store`, error);
    let store = FALLBACK_SETTINGS_STORE.get(ctx);
    if (!store) {
      store = {};
      FALLBACK_SETTINGS_STORE.set(ctx, store);
    }
    return store;
  }
}

function getSettings(ctx) {
  const root = getHostExtensionSettings(ctx);
  if (!root) throw new Error(`[${MODULE_NAME}] host extension settings are unavailable`);
  if (!root[MODULE_NAME]) root[MODULE_NAME] = cloneValue(DEFAULT_SETTINGS);
  const settings = root[MODULE_NAME];
  let shouldSave = false;
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (settings[key] === undefined) {
      settings[key] = cloneValue(value);
      shouldSave = true;
    }
  }
  if (!Array.isArray(settings.modelOptions)) {
    settings.modelOptions = [];
    shouldSave = true;
  }
  if (shouldSave) saveSettings(ctx);
  return settings;
}

function saveSettings(ctx) {
  try {
    ctx?.saveSettingsDebounced?.();
  } catch (error) {
    console.warn(`[${MODULE_NAME}] unable to save host settings`, error);
  }
}

function saveSettingsImmediate(ctx) {
  try {
    const save = ctx?.saveSettings || ctx?.saveSettingsDebounced;
    if (typeof save !== 'function') return;
    const result = save.call(ctx);
    if (result && typeof result.catch === 'function') {
      result.catch((error) => console.warn(`[${MODULE_NAME}] unable to save host settings`, error));
    }
  } catch (error) {
    console.warn(`[${MODULE_NAME}] unable to save host settings`, error);
  }
}

function getApiBase(settings) {
  let apiBase = String(settings?.apiUrl || '').trim().replace(/\/+$/, '');
  apiBase = apiBase.replace(/\/(chat\/completions|models)$/i, '');
  return apiBase.replace(/\/+$/, '');
}

function getAuthHeaders(settings) {
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = String(settings?.apiKey || '').trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

function isCrossOriginUrl(url) {
  try {
    if (typeof location === 'undefined' || !location?.origin) return false;
    return new URL(url, location.href).origin !== location.origin;
  } catch {
    return false;
  }
}

function getHostProxyHeaders(extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  try {
    // 宿主上下文里才拿得到 session 绑定的 X-CSRF-Token；没有它，宿主代理 POST
    // 会撞上 CSRF 防护返回 403，从而被误判成上游 API 故障。
    const ctx = getContextSafe();
    const hostHeaders = ctx?.getRequestHeaders?.()
      || globalThis.SillyTavern?.getRequestHeaders?.()
      || globalThis.getRequestHeaders?.()
      || null;
    if (hostHeaders && typeof hostHeaders === 'object') {
      Object.entries(hostHeaders).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') headers[key] = String(value);
      });
    }
  } catch {}
  try {
    const csrfToken = document?.cookie?.match(/(?:^|;\s*)csrf_token=([^;]+)/)?.[1];
    if (csrfToken && !headers['X-CSRF-Token']) headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
  } catch {}
  return headers;
}

function buildHostProxyConfig(apiBase, settings) {
  const apiKey = String(settings?.apiKey || '').trim();
  return {
    chat_completion_source: 'custom',
    custom_url: apiBase,
    reverse_proxy: apiBase,
    proxy_password: apiKey,
    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
  };
}

function shouldFallbackFromHostProxy(responseText, status) {
  return status === 401
    || status === 403
    || status === 404
    || status === 405
    || /cannot\s+post|not\s+found|no\s+route|ENOENT/i.test(String(responseText || ''));
}

async function fetchText(url, options = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const limitMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_API_TIMEOUT_MS;
  const controller = limitMs > 0 && typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  if (controller) {
    fetchOptions.signal = controller.signal;
    timer = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, limitMs);
  }
  try {
    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    return { response, responseText };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function requestHostProxyModelList(apiBase, settings) {
  return fetchText('/api/backends/chat-completions/status', {
    method: 'POST',
    headers: getHostProxyHeaders(),
    body: JSON.stringify(buildHostProxyConfig(apiBase, settings)),
    cache: 'no-cache',
    timeoutMs: MODEL_LIST_TIMEOUT_MS,
  });
}

async function fetchModelList(settings) {
  const apiBase = getApiBase(settings);
  if (!apiBase) throw new Error('请先填写 API Base URL');
  const url = `${apiBase}/models`;
  const useHostProxy = isCrossOriginUrl(url);
  let response = null;
  let responseText = '';
  let transport = useHostProxy ? 'host-proxy' : 'direct';
  logApp('debug', `拉取模型列表: ${transport}`, url);
  try {
    if (useHostProxy) {
      let proxyError = null;
      try {
        ({ response, responseText } = await requestHostProxyModelList(apiBase, settings));
      } catch (error) {
        proxyError = error;
        console.warn(`[${MODULE_NAME}] host proxy model list failed, trying direct`, error);
      }
      if (proxyError || (!response?.ok && shouldFallbackFromHostProxy(responseText, response?.status))) {
        transport = 'direct-after-proxy-fallback';
        ({ response, responseText } = await fetchText(url, { method: 'GET', headers: getAuthHeaders(settings), timeoutMs: MODEL_LIST_TIMEOUT_MS }));
      }
    } else {
      ({ response, responseText } = await fetchText(url, { method: 'GET', headers: getAuthHeaders(settings), timeoutMs: MODEL_LIST_TIMEOUT_MS }));
    }
  } catch (error) {
    throw new Error(`模型列表连接失败（${transport}）。请检查 Base URL / API Key；也可手动填写模型名称后直接使用。原始错误: ${String(error?.message || error)}`);
  }
  if (!response?.ok) {
    throw new Error(`模型列表请求失败 ${response?.status}（${transport}）: ${String(responseText || '').slice(0, 240)}。如果此 API 不支持 /models，可手动填写模型名称。`);
  }
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`模型列表响应不是 JSON（${transport}）: ${String(responseText || '').slice(0, 180)}`);
  }
  if (data && typeof data === 'object' && data.data == null && data.models == null && data.response) {
    try {
      const nested = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
      if (nested && typeof nested === 'object') data = nested;
    } catch {}
  }
  const modelItems = Array.isArray(data?.data)
    ? data.data
    : (Array.isArray(data?.models) ? data.models : (Array.isArray(data) ? data : []));
  const models = modelItems
    .map((item) => (typeof item === 'string'
      ? item.trim()
      : String(item?.id || item?.name || item?.model || '').trim()))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  if (models.length === 0) throw new Error('API 有响应，但没有返回可用模型；可手动填写模型名称。');
  logApp('info', `模型列表拉取成功（${transport}）: ${models.length} 个模型`);
  return models;
}

function getContextSafe() {
  try {
    return globalThis.Luker?.getContext?.() || globalThis.SillyTavern?.getContext?.() || null;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] unable to read host context`, error);
    return null;
  }
}

function onHostEvent(ctx, eventName, handler, key) {
  const eventSource = ctx?.eventSource;
  if (!eventSource || typeof eventSource.on !== 'function' || typeof handler !== 'function') return;
  if (globalThis[key] && typeof eventSource.removeListener === 'function') {
    eventSource.removeListener(eventName, globalThis[key]);
    globalThis[key] = null;
  }
  const wrapped = (...args) => {
    try {
      const result = handler(...args);
      if (result && typeof result.catch === 'function') {
        result.catch((error) => console.error(`[${MODULE_NAME}] host event ${eventName} failed`, error));
      }
    } catch (error) {
      console.error(`[${MODULE_NAME}] host event ${eventName} failed`, error);
    }
  };
  globalThis[key] = wrapped;
  eventSource.on(eventName, wrapped);
}

function getSphere() {
  return document.getElementById(SPHERE_ID);
}

function getPanel() {
  return document.getElementById(PANEL_ID);
}

function clampSpherePosition(sphere, left, top) {
  const width = sphere?.offsetWidth || SPHERE_SIZE;
  const height = sphere?.offsetHeight || SPHERE_SIZE;
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - height);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

function setSpherePosition(sphere, left, top, persist = true) {
  if (!sphere) return;
  const next = clampSpherePosition(sphere, left, top);
  sphere.style.left = `${next.left}px`;
  sphere.style.top = `${next.top}px`;
  if (!persist) return;
  try {
    globalThis.localStorage?.setItem(SPHERE_POSITION_KEY, JSON.stringify(next));
  } catch {}
}

function restoreSpherePosition(sphere) {
  if (!sphere) return false;
  try {
    const raw = globalThis.localStorage?.getItem(SPHERE_POSITION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const left = Number(parsed?.left);
      const top = Number(parsed?.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        setSpherePosition(sphere, left, top, false);
        return true;
      }
    }
  } catch {}
  const currentLeft = Number.parseFloat(sphere.style.left);
  const currentTop = Number.parseFloat(sphere.style.top);
  if (Number.isFinite(currentLeft) && Number.isFinite(currentTop)) {
    setSpherePosition(sphere, currentLeft, currentTop, false);
    return true;
  }
  return false;
}

function showSphere() {
  const sphere = getSphere();
  if (!sphere) return;
  if (sphere.style.display === 'flex') return;
  restoreSpherePosition(sphere);
  sphere.style.display = 'flex';
  sphere.classList.add('is-appearing');
  setTimeout(() => sphere.classList.remove('is-appearing'), 300);
}

function hideSphere() {
  const sphere = getSphere();
  if (!sphere || sphere.style.display === 'none') return;
  logApp('debug', '悬浮球已隐藏');
  sphere.classList.add('is-shrinking');
  setTimeout(() => {
    sphere.style.display = 'none';
    sphere.classList.remove('is-shrinking');
  }, 200);
}

function initDraggableSphere(sphere) {
  let dragState = null;
  let hasMoved = false;
  let longPressTriggered = false;
  let longPressTimer = null;
  let pointerDownX = 0;
  let pointerDownY = 0;

  const clearLongPressTimer = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
  };

  const onPointerMove = (event) => {
    if (!dragState) return;
    const deltaX = event.clientX - pointerDownX;
    const deltaY = event.clientY - pointerDownY;
    if (!hasMoved && Math.hypot(deltaX, deltaY) >= SPHERE_DRAG_THRESHOLD) {
      hasMoved = true;
      clearLongPressTimer();
    }
    if (!hasMoved) return;
    setSpherePosition(sphere, event.clientX - dragState.offsetX, event.clientY - dragState.offsetY, false);
  };

  const onPointerUp = () => {
    if (!dragState) return;
    clearLongPressTimer();
    dragState = null;
    sphere.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    if (longPressTriggered) {
      longPressTriggered = false;
      return;
    }
    if (hasMoved) {
      const left = Number.parseFloat(sphere.style.left);
      const top = Number.parseFloat(sphere.style.top);
      if (Number.isFinite(left) && Number.isFinite(top)) setSpherePosition(sphere, left, top);
      return;
    }
    hideSphere();
    openPanel();
  };

  sphere.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragState = {
      offsetX: event.clientX - sphere.offsetLeft,
      offsetY: event.clientY - sphere.offsetTop,
    };
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    hasMoved = false;
    longPressTriggered = false;
    sphere.classList.add('is-dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    clearLongPressTimer();
    longPressTimer = setTimeout(() => {
      if (dragState && !hasMoved) {
        longPressTriggered = true;
        hideSphere();
      }
    }, SPHERE_LONG_PRESS_MS);
    event.preventDefault();
  });

  if (!restoreSpherePosition(sphere)) {
    const defaultLeft = Math.max(EDGE_GAP, window.innerWidth - sphere.offsetWidth - EDGE_GAP);
    const defaultTop = Math.max(EDGE_GAP, Math.round(window.innerHeight * 0.4));
    setSpherePosition(sphere, defaultLeft, defaultTop, false);
  }
  window.addEventListener('resize', () => {
    const left = Number.parseFloat(sphere.style.left);
    const top = Number.parseFloat(sphere.style.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    setSpherePosition(sphere, left, top);
  });
}

function injectScribbleFilters() {
  if (!document.body || document.getElementById('soullink-scribble-svg')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'soullink-scribble-svg';
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
  svg.innerHTML = `
    <defs>
      <filter id="soullink-wobble" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="9" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="soullink-wobble-strong" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.026" numOctaves="2" seed="5" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
}
function createSphere() {
  let sphere = getSphere();
  if (sphere) return sphere;
  sphere = document.createElement('div');
  sphere.id = SPHERE_ID;
  sphere.className = 'soullink-sphere';
  sphere.title = `${MODULE_NAME}：拖拽移动 / 点击打开 / 长按隐藏`;
  sphere.setAttribute('aria-label', MODULE_NAME);
  sphere.innerHTML = `<span class="${MENU_ICON_CLASS} soullink-sphere__icon"></span>`;
  document.body.appendChild(sphere);
  initDraggableSphere(sphere);
  return sphere;
}

function clampPanelPosition(dialog, left, top) {
  const width = dialog?.offsetWidth || 340;
  const height = dialog?.offsetHeight || 300;
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - height);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

function setPanelPosition(panel, left, top) {
  const dialog = panel?.querySelector('.soullink-panel__dialog');
  if (!panel || !dialog) return;
  const next = clampPanelPosition(dialog, left, top);
  dialog.style.left = `${next.left}px`;
  dialog.style.top = `${next.top}px`;
  panel.dataset.left = String(next.left);
  panel.dataset.top = String(next.top);
  panel.dataset.positioned = 'true';
}

function ensurePanelPosition(panel) {
  const dialog = panel?.querySelector('.soullink-panel__dialog');
  if (!panel || !dialog) return;
  const storedLeft = Number(panel.dataset.left);
  const storedTop = Number(panel.dataset.top);
  if (Number.isFinite(storedLeft) && Number.isFinite(storedTop)) {
    setPanelPosition(panel, storedLeft, storedTop);
    return;
  }
  const defaultLeft = Math.max(EDGE_GAP, window.innerWidth - dialog.offsetWidth - EDGE_GAP);
  const defaultTop = EDGE_GAP;
  setPanelPosition(panel, defaultLeft, defaultTop);
}

function initDraggablePanel(panel) {
  if (!panel || panel.dataset.dragReady === 'true') return;
  const dialog = panel.querySelector('.soullink-panel__dialog');
  const handles = panel.querySelectorAll('.soullink-drag-handle');
  if (!dialog || handles.length === 0) return;

  let dragState = null;

  const stopDragging = () => {
    dragState = null;
    dialog.classList.remove('is-dragging');
  };

  handles.forEach((handle) =>
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      // 指针落在标题栏内的按钮上（返回/关闭）时，不启动拖拽、不捕获指针，
      // 否则 setPointerCapture 会把后续 click 重定向到标题栏，按钮点击失效。
      const target = event.target;
      if (target instanceof Element && typeof target.closest === 'function' && target.closest('button')) return;
      dragState = {
        offsetX: event.clientX - dialog.offsetLeft,
        offsetY: event.clientY - dialog.offsetTop,
      };
      dialog.classList.add('is-dragging');
      handle.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }),
  );

  window.addEventListener('pointermove', (event) => {
    if (!dragState) return;
    setPanelPosition(panel, event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
  });
  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('resize', () => ensurePanelPosition(panel));
  panel.dataset.dragReady = 'true';
}

function openPanel() {
  const panel = getPanel();
  if (!panel) return;
  logApp('debug', '面板已打开');
  showPanelView(HOME_VIEW_ID);
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  ensurePanelPosition(panel);
}

function closePanel() {
  const panel = getPanel();
  if (!panel) return;
  logApp('debug', '面板已关闭');
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  showSphere();
}

function togglePanel() {
  const panel = getPanel();
  if (!panel) return;
  if (panel.classList.contains('is-open')) closePanel();
  else openPanel();
}

// ---------- 总前端：视图切换 ----------
const PANEL_VIEW_TITLES = Object.freeze({
  [HOME_VIEW_ID]: MODULE_NAME,
  [API_VIEW_ID]: 'API 连接',
  [LOG_VIEW_ID]: '日志系统',
});

function showPanelView(viewId) {
  const panel = getPanel();
  if (!panel) return;
  panel.querySelectorAll('.soullink-view').forEach((view) => {
    const active = view.id === viewId;
    view.classList.toggle('is-active', active);
    view.setAttribute('aria-hidden', active ? 'false' : 'true');
  });
  const dialog = panel.querySelector('.soullink-panel__dialog');
  if (dialog) dialog.classList.toggle('is-log-mode', viewId === LOG_VIEW_ID);
  if (viewId === LOG_VIEW_ID) {
    renderLogList();
    updateLogStats();
    logApp('debug', '打开日志视图');
  }
  const back = document.getElementById(PANEL_BACK_ID);
  if (back) back.style.visibility = viewId === HOME_VIEW_ID ? 'hidden' : 'visible';
  const title = document.getElementById(PANEL_TITLE_ID);
  if (title) title.textContent = PANEL_VIEW_TITLES[viewId] || MODULE_NAME;
  ensurePanelPosition(panel);
}

function initPanelViews(panel) {
  if (!panel || panel.dataset.viewsReady === 'true') return;
  document.getElementById(PANEL_BACK_ID)?.addEventListener('click', () => showPanelView(HOME_VIEW_ID));
  document.getElementById(HOME_API_CARD_ID)?.addEventListener('click', () => showPanelView(API_VIEW_ID));
  document.getElementById(HOME_LOG_CARD_ID)?.addEventListener('click', () => showPanelView(LOG_VIEW_ID));
  panel.dataset.viewsReady = 'true';
}

function refreshHomeApiStatus() {
  const status = document.getElementById(HOME_API_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const settings = ctx ? getSettings(ctx) : null;
    const count = Array.isArray(settings?.modelOptions) ? settings.modelOptions.length : 0;
    status.textContent = count > 0 ? `已连接 · ${count} 个模型` : '尚未连接';
    status.dataset.state = count > 0 ? 'ok' : 'idle';
  } catch (error) {
    status.textContent = '尚未连接';
    status.dataset.state = 'idle';
  }
}

function createPanel() {
  let panel = getPanel();
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'soullink-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="soullink-panel__dialog" role="dialog" aria-label="${MODULE_NAME}">
      <div class="soullink-panel__header soullink-drag-handle">
        <button type="button" id="${PANEL_BACK_ID}" class="soullink-panel__back" aria-label="返回" title="返回" style="visibility:hidden">←</button>
        <span class="${MENU_ICON_CLASS} soullink-panel__logo"></span>
        <span id="${PANEL_TITLE_ID}" class="soullink-panel__title">${MODULE_NAME}</span>
        <button type="button" class="soullink-panel__close" aria-label="关闭" title="关闭">✕</button>
      </div>
      <div class="soullink-panel__body">
        <section id="${HOME_VIEW_ID}" class="soullink-view is-active" aria-hidden="false">
          <div class="soullink-home__note">
            <p class="soullink-home__hello">嘿，欢迎回来！</p>
            <p class="soullink-home__sub">想从哪里开始？</p>
          </div>
          <div class="soullink-home__grid">
            <button type="button" id="${HOME_API_CARD_ID}" class="soullink-home__card soullink-home__card--api" title="打开 API 连接设置">
              <span class="soullink-home__card-icon"><span class="${MENU_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">API 连接</span>
              <span id="${HOME_API_STATUS_ID}" class="soullink-home__card-status" data-state="idle">尚未连接</span>
            </button>
            <button type="button" id="${HOME_LOG_CARD_ID}" class="soullink-home__card soullink-home__card--log" title="打开后台日志系统">
              <span class="soullink-home__card-icon"><span class="${LOG_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">日志系统</span>
              <span id="${HOME_LOG_STATUS_ID}" class="soullink-home__card-status" data-state="idle">记录中…</span>
            </button>
          </div>
        </section>
        <section id="${API_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-panel__section">
            <div class="soullink-panel__section-head">
              <span class="soullink-panel__section-title">API 连接</span>
              <span id="soullink-api-status" class="soullink-api__status" data-state="idle">尚未连接</span>
            </div>
            <label class="soullink-api__field" for="soullink-api-url">
              <span class="soullink-api__label">Base URL</span>
              <input id="soullink-api-url" class="soullink-input" type="text" placeholder="https://api.openai.com/v1" autocomplete="off" spellcheck="false" />
            </label>
            <label class="soullink-api__field" for="soullink-api-key">
              <span class="soullink-api__label">API Key</span>
              <span class="soullink-api__key-row">
                <input id="soullink-api-key" class="soullink-input" type="password" placeholder="sk-..." autocomplete="off" spellcheck="false" />
                <button type="button" id="soullink-api-key-toggle" class="soullink-icon-btn" title="显示密钥" aria-label="显示密钥">👁</button>
              </span>
            </label>
            <div class="soullink-api__actions">
              <button type="button" id="soullink-api-connect" class="soullink-btn soullink-btn--primary">连接并拉取模型</button>
            </div>
            <div class="soullink-api__field">
              <span class="soullink-api__label">模型</span>
              <select id="soullink-api-model-list" class="soullink-input">
                <option value="">请先连接并拉取模型</option>
              </select>
              <input id="soullink-api-model" class="soullink-input" type="text" placeholder="或手动填写模型名称" autocomplete="off" spellcheck="false" />
            </div>
            <p class="soullink-api__hint">支持任意 OpenAI 兼容接口；不支持 /models 的渠道可手动填写模型名称。</p>
          </div>
        </section>
        <section id="${LOG_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-log">
            <div class="soullink-log__chips" role="group" aria-label="按级别筛选日志">
              <button type="button" class="soullink-log__chip is-active" data-level="">全部 <span class="soullink-log__chip-count" data-level="">0</span></button>
              <button type="button" class="soullink-log__chip" data-level="debug">调试 <span class="soullink-log__chip-count" data-level="debug">0</span></button>
              <button type="button" class="soullink-log__chip" data-level="info">信息 <span class="soullink-log__chip-count" data-level="info">0</span></button>
              <button type="button" class="soullink-log__chip" data-level="warn">警告 <span class="soullink-log__chip-count" data-level="warn">0</span></button>
              <button type="button" class="soullink-log__chip" data-level="error">错误 <span class="soullink-log__chip-count" data-level="error">0</span></button>
            </div>
            <div class="soullink-log__tools">
              <input id="${LOG_SEARCH_ID}" class="soullink-input soullink-log__search" type="search" placeholder="🔍 搜索日志内容…" autocomplete="off" spellcheck="false" />
              <select id="${LOG_MAX_ID}" class="soullink-input soullink-log__max" title="内存中保留的日志条数，超出自动丢弃最旧">
                <option value="500">500 条</option>
                <option value="2000" selected>2000 条</option>
                <option value="5000">5000 条</option>
                <option value="10000">10000 条</option>
              </select>
            </div>
            <div class="soullink-log__actions">
              <button type="button" id="${LOG_PAUSE_ID}" class="soullink-log__action" title="暂停时新日志只入内存、不再追加到列表">⏸ 暂停</button>
              <button type="button" id="${LOG_AUTOSCROLL_ID}" class="soullink-log__action is-active" title="新日志自动滚动到底部">⏬ 跟随</button>
              <button type="button" id="${LOG_CLEAR_ID}" class="soullink-log__action" title="清空缓冲中的所有日志">🧹 清空</button>
              <button type="button" id="${LOG_COPY_ID}" class="soullink-log__action" title="复制全部日志为纯文本">📋 复制</button>
              <button type="button" id="${LOG_EXPORT_ID}" class="soullink-log__action" title="导出完整 JSON 日志文件">💾 导出</button>
            </div>
            <div class="soullink-log__console">
              <div id="${LOG_LIST_ID}" class="soullink-log__list" role="log" aria-live="off" aria-label="运行日志"></div>
              <button type="button" id="${LOG_BACK_ID}" class="soullink-log__back" hidden>↓ 回到最新</button>
            </div>
            <div class="soullink-log__status">
              <span id="${LOG_STATUS_ID}">共 0 条</span>
              <span id="${LOG_PAUSED_ID}" class="soullink-log__paused" hidden>已暂停 · 新增 +0</span>
            </div>
          </div>
        </section>
      </div>
      <div class="soullink-panel__footer">
        <span>v${MODULE_VERSION}</span>
        <a class="soullink-panel__link" href="https://github.com/Rosa9527/SoulLink" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  initDraggablePanel(panel);
  initApiSection(panel);
  initPanelViews(panel);
  initLogView(panel);
  panel.querySelector('.soullink-panel__close')?.addEventListener('click', closePanel);
  if (!globalThis[ESC_KEY_HANDLER_KEY]) {
    globalThis[ESC_KEY_HANDLER_KEY] = (event) => {
      if (event.key !== 'Escape') return;
      const activeView = panel.querySelector('.soullink-view.is-active');
      if (activeView && activeView.id !== HOME_VIEW_ID) {
        showPanelView(HOME_VIEW_ID);
        return;
      }
      closePanel();
    };
    document.addEventListener('keydown', globalThis[ESC_KEY_HANDLER_KEY]);
  }
  return panel;
}

// ---------- API 连接面板 UI ----------
function setApiStatus(message, state = 'idle') {
  const status = document.getElementById(API_STATUS_ID);
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function populateModelList(settings) {
  const select = document.getElementById(API_MODEL_LIST_ID);
  if (!select) return;
  const models = Array.isArray(settings?.modelOptions) ? settings.modelOptions : [];
  select.innerHTML = '';
  if (models.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '请先连接并拉取模型';
    select.appendChild(option);
    return;
  }
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '选择一个模型';
  select.appendChild(placeholder);
  for (const modelId of models) {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelId;
    if (modelId === settings.model) option.selected = true;
    select.appendChild(option);
  }
}

function readApiForm(ctx) {
  const settings = getSettings(ctx);
  settings.apiUrl = String(document.getElementById(API_URL_ID)?.value || '').trim();
  settings.apiKey = String(document.getElementById(API_KEY_ID)?.value || '').trim();
  return settings;
}

async function connectAndLoadModels(ctx) {
  const settings = readApiForm(ctx);
  logApp('info', '开始连接 API', getApiBase(settings) || '');
  if (!getApiBase(settings)) {
    setApiStatus('请先填写 API Base URL', 'error');
    globalThis.toastr?.error?.('请先填写 API Base URL', `[${MODULE_NAME}]`);
    return;
  }
  const button = document.getElementById(API_CONNECT_ID);
  if (button) button.disabled = true;
  setApiStatus('连接中，正在拉取模型...', 'busy');
  try {
    const models = await fetchModelList(settings);
    settings.modelOptions = models;
    if (!settings.model || !models.includes(settings.model)) settings.model = models[0];
    saveSettingsImmediate(ctx);
    populateModelList(settings);
    const modelInput = document.getElementById(API_MODEL_ID);
    if (modelInput) modelInput.value = settings.model;
    setApiStatus(`已连接，拉取到 ${models.length} 个模型`, 'ok');
    globalThis.toastr?.success?.(`[${MODULE_NAME}] 已拉取 ${models.length} 个模型`);
  } catch (error) {
    console.error(`[${MODULE_NAME}] connectAndLoadModels failed`, error);
    const message = String(error?.message || error);
    setApiStatus(message, 'error');
    globalThis.toastr?.error?.(message, `[${MODULE_NAME}]`);
  } finally {
    if (button) button.disabled = false;
    refreshHomeApiStatus();
  }
}

function applyApiSettingsToForm(ctx) {
  const settings = getSettings(ctx);
  const setValue = (id, value) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.value = value ?? '';
  };
  setValue(API_URL_ID, settings.apiUrl);
  setValue(API_KEY_ID, settings.apiKey);
  setValue(API_MODEL_ID, settings.model);
  populateModelList(settings);
  if (settings.modelOptions.length > 0) {
    setApiStatus(`已缓存 ${settings.modelOptions.length} 个模型`, 'ok');
  } else {
    setApiStatus('尚未连接', 'idle');
  }
  refreshHomeApiStatus();
}

function initApiSection(panel) {
  if (!panel || panel.dataset.apiReady === 'true') return;
  const getCtx = () => getContextSafe();

  document.getElementById(API_CONNECT_ID)?.addEventListener('click', () => {
    const ctx = getCtx();
    if (!ctx) return;
    connectAndLoadModels(ctx);
  });

  document.getElementById(API_KEY_TOGGLE_ID)?.addEventListener('click', (event) => {
    const input = document.getElementById(API_KEY_ID);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? '🙈' : '👁';
    event.currentTarget.title = show ? '隐藏密钥' : '显示密钥';
  });

  const bindPersist = (id, key) => {
    document.getElementById(id)?.addEventListener('input', () => {
      const ctx = getCtx();
      if (!ctx) return;
      const settings = getSettings(ctx);
      settings[key] = String(document.getElementById(id)?.value || '').trim();
      saveSettings(ctx);
    });
  };
  bindPersist(API_URL_ID, 'apiUrl');
  bindPersist(API_KEY_ID, 'apiKey');

  document.getElementById(API_MODEL_LIST_ID)?.addEventListener('change', (event) => {
    const ctx = getCtx();
    if (!ctx) return;
    const settings = getSettings(ctx);
    settings.model = String(event.target?.value || '').trim();
    const modelInput = document.getElementById(API_MODEL_ID);
    if (modelInput) modelInput.value = settings.model;
    saveSettings(ctx);
  });
  bindPersist(API_MODEL_ID, 'model');

  try {
    const ctx = getCtx();
    if (ctx) applyApiSettingsToForm(ctx);
  } catch (error) {
    console.warn(`[${MODULE_NAME}] applyApiSettingsToForm failed`, error);
  }
  panel.dataset.apiReady = 'true';
}

// ---------- 日志系统：捕获与存储 ----------
const CONSOLE_ORIGINALS = {};
let logEntries = [];
let logSequence = 0;
let logMaxEntries = LOG_MAX_ENTRIES_DEFAULT;
let logAutoScroll = true;
let logPaused = false;
let logPausedCount = 0;
let logLevelFilter = '';
let logSearchQuery = '';
let logVisibleCount = 0;
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

function pushLogEntry(level, source, args) {
  try {
    const safeLevel = LOG_LEVELS.includes(level) ? level : 'info';
    const timestamp = Date.now();
    logEntries.push({
      id: ++logSequence,
      ts: timestamp,
      time: formatLogTime(timestamp),
      level: safeLevel,
      source: String(source || 'app').slice(0, 24),
      message: buildLogMessage(Array.isArray(args) ? args : [args]),
    });
    if (logEntries.length > logMaxEntries) logEntries.splice(0, logEntries.length - logMaxEntries);
    if (logPaused) logPausedCount += 1;
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
    const previous = wrappers[eventName];
    if (previous && typeof eventSource.removeListener === 'function') {
      eventSource.removeListener(eventName, previous);
    }
    const wrapped = (...args) => pushLogEntry('debug', 'event', [`[${eventName}]`, ...args]);
    wrappers[eventName] = wrapped;
    eventSource.on(eventName, wrapped);
  }
}

function scheduleFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') return globalThis.requestAnimationFrame(callback);
  return setTimeout(callback, 16);
}

function entryMatchesLog(entry) {
  if (logLevelFilter && entry.level !== logLevelFilter) return false;
  const query = logSearchQuery.trim().toLowerCase();
  if (!query) return true;
  return `${entry.time} ${entry.level} ${entry.source} ${entry.message}`.toLowerCase().includes(query);
}

function getVisibleLogEntries() {
  return logEntries.filter(entryMatchesLog);
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
  row.append(time, level, source, text);
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

function appendLiveLogEntry(entry) {
  const list = document.getElementById(LOG_LIST_ID);
  const view = document.getElementById(LOG_VIEW_ID);
  if (!list || !view || !entry) return;
  if (!view.classList.contains('is-active') || logPaused) return;
  if (!entryMatchesLog(entry)) return;
  const shouldFollow = logAutoScroll && isLogAtBottom(list);
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
    paused.hidden = !logPaused;
    if (logPaused) paused.textContent = `已暂停 · 新增 +${logPausedCount}`;
  }
  const homeStatus = document.getElementById(HOME_LOG_STATUS_ID);
  if (homeStatus) {
    const errors = counts.error || 0;
    homeStatus.textContent = errors > 0 ? `已记录 ${total} 条 · ${errors} 个错误` : `已记录 ${total} 条`;
    homeStatus.dataset.state = errors > 0 ? 'error' : (total > 0 ? 'ok' : 'idle');
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
    .map((entry) => `${entry.time} [${entry.level}] (${entry.source}) ${entry.message}`)
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
  };
  refreshPrefs();

  const autoscroll = document.getElementById(LOG_AUTOSCROLL_ID);
  if (autoscroll) autoscroll.classList.toggle('is-active', logAutoScroll);

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
    logPaused = !logPaused;
    logPausedCount = 0;
    const pause = document.getElementById(LOG_PAUSE_ID);
    if (pause) {
      pause.textContent = logPaused ? '▶ 继续' : '⏸ 暂停';
      pause.classList.toggle('is-active', logPaused);
    }
    if (!logPaused) renderLogList();
    updateLogStats();
  });

  autoscroll?.addEventListener('click', () => {
    logAutoScroll = !logAutoScroll;
    autoscroll.classList.toggle('is-active', logAutoScroll);
    autoscroll.title = logAutoScroll ? '新日志自动滚动到底部' : '新日志不再自动滚动';
    const ctx = getCtx();
    if (ctx) {
      getSettings(ctx).logAutoScroll = logAutoScroll;
      saveSettings(ctx);
    }
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
    logPausedCount = 0;
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
      globalThis.toastr?.error?.(`复制失败: ${error?.message || error}`, `[${MODULE_NAME}]`);
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

initLogCapture();
exposeLogApi();

function hasMenuEntry() {
  const menu = document.getElementById('extensionsMenu');
  if (!menu) return false;
  return Array.from(menu.children).some((node) => (
    node.id === MENU_ITEM_ID || node.id === MENU_API_ID || String(node.textContent || '').trim() === MODULE_NAME
  ));
}

function createManualMenuItem() {
  if (hasMenuEntry()) return true;
  const menu = document.getElementById('extensionsMenu');
  if (!menu) return false;
  const item = document.createElement('div');
  item.id = MENU_ITEM_ID;
  item.className = 'list-group-item flex-container flexGap5 interactable';
  item.tabIndex = 0;
  item.innerHTML = `<div class="${MENU_ICON_CLASS} extensionsMenuExtensionButton"></div><span>${MODULE_NAME}</span>`;
  const handleActivate = (event) => {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    if (event.type === 'keydown') event.preventDefault();
    togglePanel();
  };
  item.addEventListener('click', handleActivate);
  item.addEventListener('keydown', handleActivate);
  menu.appendChild(item);
  return true;
}

function ensureManualMenuItem(retries = MENU_RETRY_COUNT) {
  if (createManualMenuItem()) return;
  if (retries <= 0) {
    console.warn(`[${MODULE_NAME}] 未找到 #extensionsMenu，无法插入菜单项。`);
    return;
  }
  setTimeout(() => ensureManualMenuItem(retries - 1), 500);
}

function ensureMenuRecovery() {
  const insertRecoveryEntry = () => {
    if (!createManualMenuItem()) return false;
    document.getElementById('extensionsMenuButton')?.style.setProperty('display', 'flex');
    return true;
  };

  insertRecoveryEntry();
  if (globalThis[MENU_RECOVERY_OBSERVER_KEY] || typeof MutationObserver !== 'function' || !document.body) return;

  let scheduled = false;
  const observer = new MutationObserver((mutations) => {
    const menuChanged = mutations.some((mutation) => {
      if (mutation.target instanceof Element && mutation.target.id === 'extensionsMenu') return true;
      return Array.from(mutation.addedNodes).some((node) => (
        node instanceof Element && (node.id === 'extensionsMenu' || Boolean(node.querySelector?.('#extensionsMenu')))
      ));
    });
    if (!menuChanged || scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      insertRecoveryEntry();
    }, 0);
  });
  globalThis[MENU_RECOVERY_OBSERVER_KEY] = observer;
  observer.observe(document.body, { childList: true, subtree: true });
}

async function registerHostMenuItem() {
  const uiApi = globalThis.ST_API?.ui;
  if (typeof uiApi?.registerExtensionsMenuItem !== 'function') return false;
  const result = await uiApi.registerExtensionsMenuItem({
    id: MENU_API_ID,
    label: MODULE_NAME,
    icon: MENU_ICON_CLASS,
    onClick: () => togglePanel(),
  });
  return result !== false;
}

async function registerMenuItem() {
  ensureMenuRecovery();
  ensureManualMenuItem(MENU_RETRY_COUNT);

  const tauriReady = globalThis.__TAURITAVERN__?.ready || globalThis.__TAURITAVERN_MAIN_READY__;
  if (tauriReady && typeof tauriReady.then === 'function') {
    try {
      await tauriReady;
    } catch (error) {
      console.warn(`[${MODULE_NAME}] 等待 TauriTavern 宿主就绪失败。`, error);
    }
  }
  let registered = false;
  try {
    registered = await registerHostMenuItem();
  } catch (error) {
    console.warn(`[${MODULE_NAME}] host 菜单注册失败，改用手动注入。`, error);
  }
  if (registered) {
    document.getElementById(MENU_ITEM_ID)?.remove();
    logApp('info', '扩展菜单已通过宿主 API 注册');
    return;
  }
  ensureManualMenuItem();
  logApp('info', '扩展菜单已注入 #extensionsMenu');
}

async function bootstrap() {
  if (globalThis[BOOTSTRAP_RUNTIME_KEY]) return;
  const ctx = getContextSafe();
  if (!ctx || !document.body) return;
  globalThis[BOOTSTRAP_RUNTIME_KEY] = true;
  try {
    initHostEventLogging();
    injectScribbleFilters();
    createPanel();
    createSphere();
    showSphere();
    await registerMenuItem();
    logApp('info', `扩展就绪 v${MODULE_VERSION}`);
  } catch (error) {
    globalThis[BOOTSTRAP_RUNTIME_KEY] = false;
    throw error;
  }
}

onHostEvent(getContextSafe(), 'appReady', bootstrap, APP_READY_HANDLER_KEY);

function scheduleBootstrapFallback(retries = BOOTSTRAP_RETRY_COUNT) {
  const attempt = () => {
    bootstrap()
      .catch((error) => console.error(`[${MODULE_NAME}] bootstrap failed`, error))
      .finally(() => {
        if (!globalThis[BOOTSTRAP_RUNTIME_KEY] && retries > 0) {
          retries -= 1;
          setTimeout(attempt, 500);
        }
      });
  };
  attempt();
}
scheduleBootstrapFallback();



