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
    globalThis.toastr?.success?.(`API 已拉取 ${models.length} 个模型`, `[${MODULE_NAME}]`);
  } catch (error) {
    console.error(`[${MODULE_NAME}] connectAndLoadModels failed`, error);
    const message = String(error?.message || error);
    setApiStatus(message, 'error');
    globalThis.toastr?.error?.(`API 连接失败：${message}`, `[${MODULE_NAME}]`);
  } finally {
    if (button) button.disabled = false;
    refreshHomeApiStatus();
  }
}

function renderApiConcurrencyControl() {
  const toggle = document.getElementById(API_CONCURRENCY_TOGGLE_ID);
  const input = document.getElementById(API_CONCURRENCY_INPUT_ID);
  if (!toggle && !input) return;
  const ctx = getContextSafe();
  const settings = ctx ? getSettings(ctx) : null;
  if (!settings) return;
  const enabled = settings.apiConcurrencyEnabled !== false;
  if (toggle) {
    toggle.textContent = enabled ? '🔀 并发限制：开' : '🔀 并发限制：关';
    toggle.classList.toggle('is-active', enabled);
    toggle.title = enabled ? '点击关闭并发限制' : '点击开启并发限制';
  }
  if (input) {
    input.value = settings.apiConcurrencyLimit;
    input.disabled = !enabled;
  }
}

function toggleApiConcurrency() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.apiConcurrencyEnabled = !settings.apiConcurrencyEnabled;
  saveSettingsImmediate(ctx);
  renderApiConcurrencyControl();
  logApp('info', settings.apiConcurrencyEnabled ? '并发限制已开启' : '并发限制已关闭');
  globalThis.toastr?.info?.(`API 并发限制已${settings.apiConcurrencyEnabled ? '开启' : '关闭'}`, `[${MODULE_NAME}]`);
}

function clampApiConcurrencyLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1;
  return Math.min(10, Math.max(1, Math.floor(num)));
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
  const effortSelect = document.getElementById(API_REASONING_EFFORT_ID);
  if (effortSelect) effortSelect.value = String(settings.apiReasoningEffort || '');
  renderApiConcurrencyControl();
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

  document.getElementById(API_CONCURRENCY_TOGGLE_ID)?.addEventListener('click', toggleApiConcurrency);
  const concurrencyInput = document.getElementById(API_CONCURRENCY_INPUT_ID);
  concurrencyInput?.addEventListener('input', (event) => {
    const ctx = getCtx();
    if (!ctx) return;
    const settings = getSettings(ctx);
    settings.apiConcurrencyLimit = clampApiConcurrencyLimit(event.target?.value);
    saveSettings(ctx);
  });
  concurrencyInput?.addEventListener('change', (event) => {
    if (!event.target) return;
    event.target.value = clampApiConcurrencyLimit(event.target.value);
  });

  document.getElementById(API_REASONING_EFFORT_ID)?.addEventListener('change', (event) => {
    const ctx = getCtx();
    if (!ctx) return;
    const settings = getSettings(ctx);
    settings.apiReasoningEffort = String(event.target?.value || '');
    saveSettings(ctx);
    logApp('info', '思考强度已设置', settings.apiReasoningEffort || '默认（不发送）');
  });

  try {
    const ctx = getCtx();
    if (ctx) applyApiSettingsToForm(ctx);
  } catch (error) {
    console.warn(`[${MODULE_NAME}] applyApiSettingsToForm failed`, error);
  }
  panel.dataset.apiReady = 'true';
}
