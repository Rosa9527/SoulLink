// ---------- 预设系统：视图 UI ----------
let presetActiveKey = PRESET_DEFAULT_KEY;
const presetUnsaved = {};

function getPromptSettings(ctx) {
  const settings = ctx ? getSettings(ctx) : null;
  return settings && typeof settings.prompts === 'object' && settings.prompts ? settings.prompts : DEFAULT_PROMPTS;
}

function getPromptSavedText(key, ctx) {
  const prompts = getPromptSettings(ctx);
  return typeof prompts[key] === 'string' ? prompts[key] : DEFAULT_PROMPTS[key];
}

function getEditorText() {
  return String(document.getElementById(PRESET_TEXT_ID)?.value ?? '');
}

function getPromptDirty(key) {
  return presetUnsaved[key] !== undefined;
}

function updatePresetTabs() {
  document.querySelectorAll('.soullink-preset__tab').forEach((tab) => {
    const key = tab.dataset.promptKey;
    const active = key === presetActiveKey;
    tab.classList.toggle('is-active', active);
    tab.classList.toggle('is-dirty', getPromptDirty(key));
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function updatePresetStatus(key) {
  const status = document.getElementById(PRESET_STATUS_ID);
  const countNode = document.getElementById(PRESET_COUNT_ID);
  const saveBtn = document.getElementById(PRESET_SAVE_ID);
  const resetBtn = document.getElementById(PRESET_RESET_ID);
  const text = getEditorText();
  const dirty = getPromptDirty(key);
  if (status) {
    status.textContent = dirty ? '未保存的更改' : (text === DEFAULT_PROMPTS[key] ? '默认内容' : '已保存的自定义内容');
    status.dataset.state = dirty ? 'dirty' : (text === DEFAULT_PROMPTS[key] ? 'default' : 'custom');
  }
  if (countNode) countNode.textContent = `${text.length} 字 · ${text.split('\n').length} 行`;
  if (saveBtn) saveBtn.disabled = !dirty;
  if (resetBtn) resetBtn.disabled = !dirty && text === DEFAULT_PROMPTS[key];
  updatePresetTabs();
}

function renderPresetEditor() {
  const ctx = getContextSafe();
  const textarea = document.getElementById(PRESET_TEXT_ID);
  if (!textarea) return;
  textarea.value = presetUnsaved[presetActiveKey] !== undefined ? presetUnsaved[presetActiveKey] : getPromptSavedText(presetActiveKey, ctx);
  updatePresetStatus(presetActiveKey);
}

function refreshHomePresetStatus() {
  const status = document.getElementById(HOME_PRESET_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const prompts = getPromptSettings(ctx);
    let customized = 0;
    for (const key of Object.keys(DEFAULT_PROMPTS)) {
      if (typeof prompts[key] === 'string' && prompts[key] !== DEFAULT_PROMPTS[key]) customized += 1;
    }
    status.textContent = customized > 0 ? `已自定义 ${customized} 份` : '默认配置';
    status.dataset.state = customized > 0 ? 'ok' : 'idle';
  } catch (error) {
    status.textContent = '默认配置';
    status.dataset.state = 'idle';
  }
}

function savePreset(key) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const prompts = getPromptSettings(ctx);
  prompts[key] = getEditorText();
  saveSettingsImmediate(ctx);
  delete presetUnsaved[key];
  updatePresetStatus(key);
  refreshHomePresetStatus();
  logApp('info', '预设已保存', PRESET_META[key].title);
  globalThis.toastr?.success?.(`${PRESET_META[key].title} 已保存`, `[${MODULE_NAME}]`);
}

async function resetPreset(key) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const dirty = getPromptDirty(key);
  const text = getEditorText();
  if (dirty || text !== DEFAULT_PROMPTS[key]) {
    const what = dirty ? '未保存的修改' : '已保存的自定义内容';
    const confirmed = await showConfirm(`将「${PRESET_META[key].title}」恢复为默认内容？当前${what}将被默认内容覆盖。`);
    if (!confirmed) return;
  }
  const textarea = document.getElementById(PRESET_TEXT_ID);
  if (textarea) textarea.value = DEFAULT_PROMPTS[key];
  const prompts = getPromptSettings(ctx);
  prompts[key] = DEFAULT_PROMPTS[key];
  saveSettingsImmediate(ctx);
  delete presetUnsaved[key];
  updatePresetStatus(key);
  refreshHomePresetStatus();
  logApp('info', '预设已恢复默认', PRESET_META[key].title);
  globalThis.toastr?.info?.(`${PRESET_META[key].title} 已恢复默认`, `[${MODULE_NAME}]`);
}

function initPresetSection(panel) {
  if (!panel || panel.dataset.presetReady === 'true') return;
  const getCtx = () => getContextSafe();

  document.getElementById(PRESET_TABS_ID)?.addEventListener('click', (event) => {
    const tab = event.target.closest('.soullink-preset__tab');
    if (!tab || !tab.dataset.promptKey) return;
    presetActiveKey = tab.dataset.promptKey;
    renderPresetEditor();
  });

  document.getElementById(PRESET_TEXT_ID)?.addEventListener('input', () => {
    const ctx = getCtx();
    const text = getEditorText();
    if (text === getPromptSavedText(presetActiveKey, ctx)) delete presetUnsaved[presetActiveKey];
    else presetUnsaved[presetActiveKey] = text;
    updatePresetStatus(presetActiveKey);
  });

  document.getElementById(PRESET_SAVE_ID)?.addEventListener('click', () => savePreset(presetActiveKey));
  document.getElementById(PRESET_RESET_ID)?.addEventListener('click', () => resetPreset(presetActiveKey));

  renderPresetEditor();
  refreshHomePresetStatus();
  panel.dataset.presetReady = 'true';
  logApp('info', '预设系统已就绪');
}
