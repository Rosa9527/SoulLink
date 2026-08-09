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
  refreshHomePresetStatus();
  refreshHomeStatuses();
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
  if (confirmResolve) settleConfirm(false);
}

function togglePanel() {
  const panel = getPanel();
  if (!panel) return;
  if (panel.classList.contains('is-open')) closePanel();
  else openPanel();
}

// ---------- 确认弹层 ----------
// TauriTavern 的 WebView 会把 window.confirm 拦截为 plugin:dialog|confirm 命令，
// 但宿主 ACL 未放行该命令，调用会 Promise reject 并打印
// 「Command plugin:dialog|confirm not allowed by ACL」。因此自绘确认弹层。
let confirmResolve = null;

function settleConfirm(result) {
  const resolve = confirmResolve;
  confirmResolve = null;
  getPanel()?.querySelector('.soullink-confirm')?.classList.remove('is-open');
  resolve?.(result);
}

function showConfirm(message) {
  const panel = getPanel();
  if (!panel) return Promise.resolve(false);
  if (confirmResolve) {
    confirmResolve(false);
    confirmResolve = null;
  }
  let overlay = panel.querySelector('.soullink-confirm');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'soullink-confirm';
    overlay.innerHTML = `
      <div class="soullink-confirm__card" role="alertdialog" aria-modal="true" aria-label="确认操作">
        <p class="soullink-confirm__message"></p>
        <div class="soullink-confirm__actions">
          <button type="button" class="soullink-btn soullink-confirm__cancel">取消</button>
          <button type="button" class="soullink-btn soullink-confirm__ok">确定</button>
        </div>
      </div>
    `;
    overlay.querySelector('.soullink-confirm__cancel')?.addEventListener('click', () => settleConfirm(false));
    overlay.querySelector('.soullink-confirm__ok')?.addEventListener('click', () => settleConfirm(true));
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') settleConfirm(false);
    });
    panel.appendChild(overlay);
  }
  overlay.querySelector('.soullink-confirm__message').textContent = message;
  overlay.classList.add('is-open');
  overlay.querySelector('.soullink-confirm__ok')?.focus?.();
  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

// ---------- 总前端：视图切换 ----------
const PANEL_VIEW_TITLES = Object.freeze({
  [HOME_VIEW_ID]: MODULE_NAME,
  [API_VIEW_ID]: 'API 连接',
  [LOG_VIEW_ID]: '日志系统',
  [PRESET_VIEW_ID]: '预设',
  [REGISTER_VIEW_ID]: '角色注册',
  [ARCHIVE_VIEW_ID]: '档案系统',
  [WORLDBOOK_VIEW_ID]: '世界书',
  [ROUND_VIEW_ID]: '角色扮演',
});
const PANEL_WIDE_MODES = Object.freeze({
  [LOG_VIEW_ID]: 'is-log-mode',
  [PRESET_VIEW_ID]: 'is-preset-mode',
  [ARCHIVE_VIEW_ID]: 'is-archive-mode',
  [WORLDBOOK_VIEW_ID]: 'is-worldbook-mode',
  [ROUND_VIEW_ID]: 'is-round-mode',
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
  if (dialog) {
    for (const mode of Object.values(PANEL_WIDE_MODES)) dialog.classList.remove(mode);
    const wideMode = PANEL_WIDE_MODES[viewId];
    if (wideMode) dialog.classList.add(wideMode);
  }
  if (viewId === LOG_VIEW_ID) {
    renderLogList();
    updateLogStats();
    logApp('debug', '打开日志视图');
  }
  if (viewId === PRESET_VIEW_ID) {
    renderPresetEditor();
    logApp('debug', '打开预设视图');
  }
  if (viewId === REGISTER_VIEW_ID) {
    renderRegisterList();
    renderNpcDeductionToggle();
    logApp('debug', '打开角色注册视图');
  }
  if (viewId === ARCHIVE_VIEW_ID) {
    renderArchiveList();
    logApp('debug', '打开档案系统视图');
  }
  if (viewId === WORLDBOOK_VIEW_ID) {
    renderWorldBookList();
    logApp('debug', '打开世界书视图');
  }
  if (viewId === ROUND_VIEW_ID) {
    renderRoundView();
    logApp('debug', '打开角色扮演视图');
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
  document.getElementById(HOME_LOG_ICON_ID)?.addEventListener('click', () => showPanelView(LOG_VIEW_ID));
  document.getElementById(HOME_PRESET_CARD_ID)?.addEventListener('click', () => showPanelView(PRESET_VIEW_ID));
  document.getElementById(HOME_REGISTER_CARD_ID)?.addEventListener('click', () => showPanelView(REGISTER_VIEW_ID));
  document.getElementById(HOME_ARCHIVE_CARD_ID)?.addEventListener('click', () => showPanelView(ARCHIVE_VIEW_ID));
  document.getElementById(HOME_WORLDBOOK_CARD_ID)?.addEventListener('click', () => showPanelView(WORLDBOOK_VIEW_ID));
  document.getElementById(HOME_ROUND_CARD_ID)?.addEventListener('click', () => showPanelView(ROUND_VIEW_ID));
  document.getElementById(ROUND_COPY_ID)?.addEventListener('click', copyRoundInjectionText);
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

// ---------- 版本检查（GitHub 对比） ----------
let versionCheckCache = null;

function compareVersions(a, b) {
  const parse = (v) => String(v || '').trim().replace(/^v/i, '').split('.').map((part) => {
    const num = Number.parseInt(part, 10);
    return Number.isFinite(num) ? num : 0;
  });
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function renderVersionCheck(node, cache) {
  if (!node || !cache) return;
  if (cache.isLatest) {
    node.dataset.state = 'ok';
    node.textContent = '已是最新版';
    node.title = '当前已是最新版本，点击重新检查';
  } else {
    node.dataset.state = 'new';
    node.textContent = `发现新版本 v${cache.latest}`;
    node.title = `GitHub 上已有新版本 v${cache.latest}，点击重新检查`;
  }
}

async function fetchLatestManifestVersion() {
  const sources = [
    {
      url: GITHUB_MANIFEST_URL,
      parse: (text) => JSON.parse(text)?.version,
    },
    {
      url: GITHUB_API_MANIFEST_URL,
      parse: (text) => {
        const data = JSON.parse(text);
        if (data?.encoding !== 'base64' || typeof data?.content !== 'string') {
          throw new Error('API 响应格式异常');
        }
        if (typeof globalThis.atob !== 'function') throw new Error('环境不支持 base64 解码');
        return JSON.parse(globalThis.atob(data.content))?.version;
      },
    },
  ];
  let lastError = null;
  for (const source of sources) {
    try {
      const { response, responseText } = await fetchText(source.url, { timeoutMs: 10000 });
      if (!response?.ok) throw new Error(`HTTP ${response?.status || '?'}`);
      const version = String(source.parse(responseText) || '').trim();
      if (!version) throw new Error('manifest 中没有版本号');
      return version;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('所有检查源都失败');
}

async function checkLatestVersion(force = false) {
  const node = document.getElementById(VERSION_CHECK_ID);
  if (!node) return;
  if (!force && versionCheckCache && Date.now() - versionCheckCache.checkedAt < VERSION_CHECK_CACHE_MS) {
    renderVersionCheck(node, versionCheckCache);
    return;
  }
  node.dataset.state = 'checking';
  node.textContent = '检查更新…';
  node.title = '正在联网检查 GitHub 上的最新版本';
  try {
    const latest = await fetchLatestManifestVersion();
    const isLatest = compareVersions(MODULE_VERSION, latest) >= 0;
    versionCheckCache = { latest, isLatest, checkedAt: Date.now() };
    renderVersionCheck(node, versionCheckCache);
    logApp('debug', `版本检查完成: 本地 v${MODULE_VERSION} / 远端 v${latest}${isLatest ? '（已是最新）' : '（发现新版本）'}`);
  } catch (error) {
    versionCheckCache = null;
    node.dataset.state = 'error';
    node.textContent = '检查失败，点击重试';
    node.title = '联网检查最新版本失败，点击重试';
    logApp('warn', `版本检查失败: ${String(error?.message || error)}`);
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
            <div class="soullink-home__note-text">
              <p class="soullink-home__hello">嘿，欢迎回来！</p>
              <p class="soullink-home__sub">想从哪里开始？</p>
            </div>
            <button type="button" id="${HOME_LOG_ICON_ID}" class="soullink-home__mini" title="打开后台日志系统">
              <span class="${LOG_ICON_CLASS}"></span>
            </button>
          </div>
          <div class="soullink-home__grid">
            <button type="button" id="${HOME_API_CARD_ID}" class="soullink-home__card soullink-home__card--api" title="打开 API 连接设置">
              <span class="soullink-home__card-icon"><span class="${MENU_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">API 连接</span>
              <span id="${HOME_API_STATUS_ID}" class="soullink-home__card-status" data-state="idle">尚未连接</span>
            </button>
            <button type="button" id="${HOME_ROUND_CARD_ID}" class="soullink-home__card soullink-home__card--round" title="查看上一轮角色扮演的结果">
              <span class="soullink-home__card-icon">
                <span class="${ROUND_ICON_CLASS}"></span>
                <span id="${HOME_ROUND_BADGE_ID}" class="soullink-home__card-badge" data-state="idle" hidden></span>
              </span>
              <span class="soullink-home__card-title">角色扮演</span>
              <span id="${HOME_ROUND_STATUS_ID}" class="soullink-home__card-status" data-state="idle">暂无记录</span>
            </button>
            <button type="button" id="${HOME_PRESET_CARD_ID}" class="soullink-home__card soullink-home__card--preset" title="打开预设管理">
              <span class="soullink-home__card-icon"><span class="${PRESET_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">预设</span>
              <span id="${HOME_PRESET_STATUS_ID}" class="soullink-home__card-status" data-state="idle">默认配置</span>
            </button>
            <button type="button" id="${HOME_REGISTER_CARD_ID}" class="soullink-home__card soullink-home__card--register" title="打开角色注册管理">
              <span class="soullink-home__card-icon"><span class="${REGISTER_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">角色注册</span>
              <span id="${HOME_REGISTER_STATUS_ID}" class="soullink-home__card-status" data-state="idle">暂无角色</span>
            </button>
            <button type="button" id="${HOME_ARCHIVE_CARD_ID}" class="soullink-home__card soullink-home__card--archive" title="打开档案系统">
              <span class="soullink-home__card-icon"><span class="${ARCHIVE_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">档案系统</span>
              <span id="${HOME_ARCHIVE_STATUS_ID}" class="soullink-home__card-status" data-state="idle">暂无档案</span>
            </button>
            <button type="button" id="${HOME_WORLDBOOK_CARD_ID}" class="soullink-home__card soullink-home__card--worldbook" title="打开世界书（触发规则跟随 SillyTavern）">
              <span class="soullink-home__card-icon"><span class="${WORLDBOOK_ICON_CLASS}"></span></span>
              <span class="soullink-home__card-title">世界书</span>
              <span id="${HOME_WORLDBOOK_STATUS_ID}" class="soullink-home__card-status" data-state="idle">跟随酒馆规则</span>
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
            <div class="soullink-api__field">
              <span class="soullink-api__label">限制并发</span>
              <div class="soullink-api__concurrency-row">
                <button type="button" id="${API_CONCURRENCY_TOGGLE_ID}" class="soullink-btn soullink-api__concurrency-toggle" title="开启/关闭并发限制">🔀 并发限制：开</button>
                <input id="${API_CONCURRENCY_INPUT_ID}" class="soullink-input soullink-api__concurrency-input" type="number" min="1" max="10" step="1" placeholder="3" autocomplete="off" aria-label="并发上限" />
              </div>
              <p class="soullink-api__hint">同时最多发送的 AI 请求数（默认 3）；多出的请求会排队等待前面的请求完成后再发送。</p>
            </div>
            <p class="soullink-api__hint">填入接口地址与 API Key 后点「连接并拉取模型」，再从列表选择模型；不支持模型列表的渠道可直接手动填写模型名称。</p>
          </div>
          <div class="soullink-panel__section soullink-filter">
            <div class="soullink-panel__section-head">
              <span class="soullink-panel__section-title">正则过滤</span>
              <span id="${FILTER_STATUS_ID}" class="soullink-filter__status" data-state="idle">读取中…</span>
            </div>
            <p class="soullink-filter__hint">档案分析、档案预筛、角色扮演预筛、角色推演这四种调用都会把最近的几条消息作为上下文；启用正则后，每条消息内容中匹配的部分会被剔除，整条内容都被匹配的消息不再进入上下文。</p>
            <div class="soullink-filter__toolbar">
              <button type="button" id="${FILTER_ADD_ID}" class="soullink-btn soullink-btn--ghost">＋ 新建</button>
              <button type="button" id="${FILTER_IMPORT_ID}" class="soullink-btn soullink-btn--ghost">📥 导入</button>
              <input id="${FILTER_IMPORT_FILE_ID}" type="file" accept=".json,application/json" hidden />
              <button type="button" id="${FILTER_EXPORT_ID}" class="soullink-btn soullink-btn--ghost">📤 导出</button>
            </div>
            <div id="${FILTER_EDITOR_ID}" class="soullink-filter__editor" hidden>
              <div class="soullink-filter__editor-meta">
                <span class="soullink-filter__editor-title">编辑正则</span>
                <span id="${FILTER_EDITOR_VALID_ID}" class="soullink-filter__valid" data-state="idle"></span>
              </div>
              <label class="soullink-filter__field" for="${FILTER_EDITOR_NAME_ID}">
                <span class="soullink-filter__label">名称</span>
                <input id="${FILTER_EDITOR_NAME_ID}" class="soullink-input" type="text" placeholder="例如：智绘姬" autocomplete="off" spellcheck="false" />
              </label>
              <label class="soullink-filter__field" for="${FILTER_EDITOR_REGEX_ID}">
                <span class="soullink-filter__label">表达式</span>
                <input id="${FILTER_EDITOR_REGEX_ID}" class="soullink-input soullink-filter__regex-input" type="text" placeholder="/<image>[\s\S]*?<\/image>/g" autocomplete="off" spellcheck="false" />
              </label>
              <p class="soullink-filter__editor-hint">支持完整字面量（/表达式/标记，如 /<image>[\s\S]*?<\/image>/g）或纯表达式两种写法；保存时校验正则能否编译。</p>
              <div class="soullink-filter__editor-actions">
                <button type="button" id="${FILTER_EDITOR_CANCEL_ID}" class="soullink-btn soullink-btn--ghost">取消</button>
                <button type="button" id="${FILTER_EDITOR_SAVE_ID}" class="soullink-btn soullink-btn--primary" disabled>💾 保存</button>
              </div>
            </div>
            <div id="${FILTER_LIST_ID}" class="soullink-filter__list"></div>
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
              <select id="${LOG_SOURCE_ID}" class="soullink-input soullink-log__source" title="按来源筛选日志">
                <option value="">全部来源</option>
                <option value="network">网络请求</option>
                <option value="soulink">SoulLink</option>
                <option value="console">控制台</option>
                <option value="event">宿主事件</option>
                <option value="external">外部扩展</option>
                <option value="window">页面错误</option>
                <option value="promise">Promise 拒绝</option>
              </select>
              <select id="${LOG_MAX_ID}" class="soullink-input soullink-log__max" title="内存中保留的日志条数，超出自动丢弃最旧">
                <option value="500">500 条</option>
                <option value="2000" selected>2000 条</option>
                <option value="5000">5000 条</option>
                <option value="10000">10000 条</option>
              </select>
            </div>
            <div class="soullink-log__actions">
              <button type="button" id="${LOG_PAUSE_ID}" class="soullink-log__action" title="暂停：新日志先缓存（+N），不追加到列表；点「继续」一次性显示">⏸ 暂停</button>
              <button type="button" id="${LOG_AUTOSCROLL_ID}" class="soullink-log__action is-active" title="跟随：钉在底部，新日志自动滚到底部（点一下关闭）">⏬ 跟随</button>
              <button type="button" id="${LOG_CLEAR_ID}" class="soullink-log__action" title="清空缓冲中的所有日志">🧹 清空</button>
              <button type="button" id="${LOG_COPY_ID}" class="soullink-log__action" title="复制全部日志为纯文本">📋 复制</button>
              <button type="button" id="${LOG_EXPORT_ID}" class="soullink-log__action" title="导出完整 JSON 日志文件">💾 导出</button>
              <button type="button" id="${LOG_FULL_BODY_EXPORT_ID}" class="soullink-log__action" title="导出最近 ${LOG_FULL_BODY_MAX} 次对话请求的完整请求体/响应体（未截断）">📦 完整请求体</button>
              <button type="button" id="${LOG_NOISE_ID}" class="soullink-log__action is-active" title="过滤已知噪音（世界书扫描 / 宏变量 dump / 正则跳过 / 事件总线 / 内部保存 / 非模型网络调用 / 宿主扩展更新检查报错）">🔇 过滤噪音</button>
            </div>
            <div class="soullink-log__console">
              <div id="${LOG_LIST_ID}" class="soullink-log__list" role="log" aria-live="off" aria-label="运行日志"></div>
              <button type="button" id="${LOG_BACK_ID}" class="soullink-log__back" hidden>↓ 回到最新</button>
            </div>
            <div class="soullink-log__status">
              <span id="${LOG_STATUS_ID}">共 0 条</span>
              <span id="${LOG_PAUSED_ID}" class="soullink-log__paused" title="暂停期间新日志只入内存（+N），点「继续」后一次性显示" hidden>已暂停 · 新增 +0</span>
            </div>
          </div>
        </section>
        <section id="${PRESET_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-preset">
            <p class="soullink-preset__note">四个子系统的提示词按标签页切换编辑，改完点「💾 保存」；「↺ 恢复默认」可还原出厂内容。</p>
            <div id="${PRESET_TABS_ID}" class="soullink-preset__tabs" role="tablist" aria-label="选择要编辑的提示词">
              ${Object.entries(PRESET_META).map(([key, meta]) => `
                <button type="button" class="soullink-preset__tab${key === presetActiveKey ? ' is-active' : ''}" role="tab" aria-selected="${key === presetActiveKey ? 'true' : 'false'}" data-prompt-key="${key}" title="${meta.title}">${meta.label}</button>
              `).join('')}
            </div>
            <div class="soullink-preset__editor">
              <div class="soullink-preset__meta">
                <span id="${PRESET_STATUS_ID}" class="soullink-preset__status" data-state="default">默认内容</span>
                <span id="${PRESET_COUNT_ID}" class="soullink-preset__count">0 字</span>
              </div>
              <textarea id="${PRESET_TEXT_ID}" class="soullink-input soullink-preset__text" spellcheck="false" aria-label="提示词内容" placeholder="（提示词内容为空）"></textarea>
              <div class="soullink-preset__actions">
                <button type="button" id="${PRESET_RESET_ID}" class="soullink-btn soullink-btn--ghost">↺ 恢复默认</button>
                <button type="button" id="${PRESET_SAVE_ID}" class="soullink-btn soullink-btn--primary" disabled>💾 保存</button>
              </div>
            </div>
          </div>
        </section>
        <section id="${REGISTER_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-register">
            <p class="soullink-register__note">输入角色名字后点「＋ 注册当前角色」（或直接回车）即可加入名单；名单与当前聊天绑定，「注销」会删除该角色的档案数据。</p>
            <div class="soullink-register__add">
              <input id="${REGISTER_INPUT_ID}" class="soullink-input soullink-register__input" type="text" placeholder="输入角色名字…" autocomplete="off" spellcheck="false" />
              <button type="button" id="${REGISTER_ADD_ID}" class="soullink-btn">＋ 注册当前角色</button>
            </div>
            <div class="soullink-register__meta">
              <span id="${REGISTER_STATUS_ID}" class="soullink-register__status">0 个角色</span>
              <span id="${REGISTER_CHAT_ID}" class="soullink-register__chat"></span>
            </div>
            <div class="soullink-register__toolbar">
              <span id="${REGISTER_NPC_STATUS_ID}" class="soullink-register__npc-status">已关闭</span>
              <button type="button" id="${REGISTER_NPC_TOGGLE_ID}" class="soullink-btn soullink-register__npc-toggle" title="开启/关闭发送前角色推演">🎭 前置推演：开</button>
            </div>
            <div id="${REGISTER_LIST_ID}" class="soullink-register__list"></div>
          </div>
        </section>
        <section id="${ARCHIVE_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-archive">
            <p class="soullink-archive__note">「🔮 分析本角色」会用最近 ${ARCHIVE_RECENT_MESSAGE_COUNT} 条对话与世界书自动更新档案（可并发），「🔮 分析全部角色」一键更新名单里所有角色，也可「✏️ 编辑」手动修改；开启「⚡ 自动维护」后，每轮 AI 回复生成结束会自动预筛并更新档案。</p>
            <div class="soullink-archive__toolbar">
              <span id="${ARCHIVE_STATUS_ID}" class="soullink-archive__count">0 个档案</span>
              <span id="${ARCHIVE_CHAT_ID}" class="soullink-archive__chat"></span>
              <button type="button" id="${AUTO_ARCHIVE_TOGGLE_ID}" class="soullink-btn soullink-archive__auto-toggle" title="开启/关闭自动档案维护">⚡ 自动维护：开</button>
              <button type="button" id="${ARCHIVE_ANALYZE_ALL_ID}" class="soullink-btn soullink-archive__analyze-all">🔮 分析全部角色</button>
            </div>
            <div id="${ARCHIVE_LIST_ID}" class="soullink-archive__list"></div>
          </div>
        </section>
        <section id="${WORLDBOOK_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-worldbook">
            <p class="soullink-worldbook__note">想让某条设定不参与档案分析，勾选该条目左侧的复选框排除即可；点「清除排除」可恢复。</p>
            <div class="soullink-worldbook__toolbar">
              <span id="${WORLDBOOK_STATUS_ID}" class="soullink-worldbook__status">读取中…</span>
              <span id="${WORLDBOOK_CHAT_ID}" class="soullink-worldbook__chat"></span>
              <button type="button" id="${WORLDBOOK_CLEAR_ID}" class="soullink-btn soullink-btn--ghost soullink-worldbook__clear" hidden>清除排除</button>
              <button type="button" id="${WORLDBOOK_REFRESH_ID}" class="soullink-btn soullink-worldbook__refresh">↻ 刷新</button>
            </div>
            <div id="${WORLDBOOK_BANNER_ID}" class="soullink-worldbook__banner" hidden></div>
            <div id="${WORLDBOOK_LIST_ID}" class="soullink-worldbook__list"></div>
          </div>
        </section>
        <section id="${ROUND_VIEW_ID}" class="soullink-view" aria-hidden="true">
          <div class="soullink-round">
            <p class="soullink-round__note">展示最近一轮「发送前角色推演」的结果：预筛入选、各角色内心独白，以及最终注入 SillyTavern 的提示词原文。</p>
            <div id="${ROUND_SUMMARY_ID}" class="soullink-round__summary" hidden></div>
            <div id="${ROUND_EMPTY_ID}" class="soullink-round__empty" hidden>还没有推演记录：开启「🎭 前置推演」并发送消息后，这里会展示最近一轮的结果。</div>
            <div class="soullink-round__gate-head" hidden>
              <span class="soullink-panel__section-title">预筛原文（Gate 返回）</span>
            </div>
            <pre id="${ROUND_GATE_TEXT_ID}" class="soullink-round__gate-text" hidden></pre>
            <div class="soullink-round__characters-head" hidden>
              <span class="soullink-panel__section-title">角色内心独白</span>
            </div>
            <div id="${ROUND_CHARACTERS_ID}" class="soullink-round__characters" hidden></div>
            <div class="soullink-round__inject-head" hidden>
              <span class="soullink-panel__section-title">注入提示词原文</span>
              <button type="button" id="${ROUND_COPY_ID}" class="soullink-btn soullink-btn--ghost soullink-round__copy">⧉ 复制</button>
            </div>
            <pre id="${ROUND_INJECT_TEXT_ID}" class="soullink-round__inject-text" hidden></pre>
          </div>
        </section>
      </div>
      <div class="soullink-panel__footer">
        <span class="soullink-panel__version">
          v${MODULE_VERSION}
          <button type="button" id="${VERSION_CHECK_ID}" class="soullink-panel__version-check" data-state="checking" title="正在联网检查 GitHub 上的最新版本">检查更新…</button>
        </span>
        <a class="soullink-panel__link" href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  initDraggablePanel(panel);
  initApiSection(panel);
  initFilterSection(panel);
  initPanelViews(panel);
  initLogView(panel);
  initPresetSection(panel);
  initRegisterSection(panel);
  initArchiveSection(panel);
  initWorldBookSection(panel);
  document.getElementById(VERSION_CHECK_ID)?.addEventListener('click', () => checkLatestVersion(true));
  checkLatestVersion();
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
