// ---------- 正则过滤面板 UI ----------
let filterEditingId = null; // 正在编辑的正则 id；null = 新建

function getFilterSettings() {
  const ctx = getContextSafe();
  return ctx ? getSettings(ctx) : null;
}

function setFilterStatus(message, state = 'idle') {
  const status = document.getElementById(FILTER_STATUS_ID);
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function renderFilterStatus() {
  const settings = getFilterSettings();
  const list = settings ? getMessageFilterList(settings) : [];
  const enabled = list.filter((item) => item && item.enabled !== false).length;
  setFilterStatus('共 ' + list.length + ' 条 · 启用 ' + enabled, enabled > 0 ? 'ok' : 'idle');
}

function formatFilterRegex(item) {
  return '/' + item.pattern + '/' + item.flags;
}

function renderFilterList() {
  const listEl = document.getElementById(FILTER_LIST_ID);
  if (!listEl) return;
  const settings = getFilterSettings();
  const list = settings ? getMessageFilterList(settings) : [];
  listEl.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'soullink-filter__empty';
    empty.textContent = '还没有正则：点「＋ 新建」添加，或「📥 导入」从 JSON 文件恢复。';
    listEl.appendChild(empty);
  }
  for (const item of list) {
    const row = document.createElement('div');
    row.className = 'soullink-filter__row';
    row.dataset.filterId = item.id;
    const toggle = document.createElement('label');
    toggle.className = 'soullink-filter__toggle';
    toggle.title = item.enabled !== false ? '点击停用该正则' : '点击启用该正则';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.enabled !== false;
    toggle.appendChild(checkbox);
    toggle.appendChild(document.createElement('span'));
    const info = document.createElement('div');
    info.className = 'soullink-filter__info';
    const nameEl = document.createElement('span');
    nameEl.className = 'soullink-filter__name';
    nameEl.textContent = item.name;
    const patternEl = document.createElement('code');
    patternEl.className = 'soullink-filter__pattern';
    patternEl.textContent = formatFilterRegex(item);
    info.appendChild(nameEl);
    info.appendChild(patternEl);
    const actions = document.createElement('div');
    actions.className = 'soullink-filter__actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'soullink-filter__action';
    editBtn.textContent = '✏️';
    editBtn.title = '编辑';
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'soullink-filter__action soullink-filter__action--danger';
    delBtn.textContent = '🗑';
    delBtn.title = '删除';
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(toggle);
    row.appendChild(info);
    row.appendChild(actions);
    listEl.appendChild(row);
  }
  renderFilterStatus();
}

function persistFilterList(ctx, list) {
  const settings = getSettings(ctx);
  settings.messageFilters = normalizeMessageFilterList(list);
  saveSettingsImmediate(ctx);
}

// 解析 /表达式/标记 字面量；不以 / 开头则按纯表达式处理（从右向左找未被转义的分隔符）。
function parseRegexLiteral(text) {
  const input = String(text || '').trim();
  if (!input) throw new Error('表达式不能为空');
  if (!input.startsWith('/')) {
    new RegExp(input);
    return { pattern: input, flags: '' };
  }
  let delimiter = -1;
  for (let i = input.length - 1; i >= 1; i--) {
    if (input[i] !== '/') continue;
    let backslashes = 0;
    for (let j = i - 1; j >= 0 && input[j] === '\\'; j--) backslashes += 1;
    if (backslashes % 2 === 1) continue; // 被转义的斜杠不是分隔符
    if (/^[dgimsuvy]*$/.test(input.slice(i + 1))) {
      delimiter = i;
      break;
    }
  }
  if (delimiter <= 0) throw new Error('无法解析，请使用 /表达式/标记 或纯表达式写法');
  const pattern = input.slice(1, delimiter);
  const flags = input.slice(delimiter + 1);
  if (!pattern) throw new Error('表达式不能为空');
  new RegExp(pattern, flags);
  return { pattern, flags };
}

function validateFilterEditor() {
  const name = String(document.getElementById(FILTER_EDITOR_NAME_ID)?.value || '').trim();
  const raw = String(document.getElementById(FILTER_EDITOR_REGEX_ID)?.value || '').trim();
  const validEl = document.getElementById(FILTER_EDITOR_VALID_ID);
  const saveBtn = document.getElementById(FILTER_EDITOR_SAVE_ID);
  let message = '';
  let state = 'error';
  if (!name) {
    message = '请填写名称';
  } else if (!raw) {
    message = '请填写表达式';
  } else {
    try {
      parseRegexLiteral(raw);
      message = '✓ 表达式有效';
      state = 'ok';
    } catch (error) {
      message = '✗ ' + String(error?.message || error);
    }
  }
  if (validEl) {
    validEl.textContent = message;
    validEl.dataset.state = state;
  }
  if (saveBtn) saveBtn.disabled = state !== 'ok';
}

function openFilterEditor(item) {
  const editor = document.getElementById(FILTER_EDITOR_ID);
  if (!editor) return;
  filterEditingId = item ? item.id : null;
  document.getElementById(FILTER_EDITOR_NAME_ID).value = item ? item.name : '';
  document.getElementById(FILTER_EDITOR_REGEX_ID).value = item ? formatFilterRegex(item) : '';
  editor.hidden = false;
  validateFilterEditor();
  document.getElementById(FILTER_EDITOR_NAME_ID)?.focus?.();
}

function closeFilterEditor() {
  const editor = document.getElementById(FILTER_EDITOR_ID);
  if (editor) editor.hidden = true;
  filterEditingId = null;
  // 关闭时清空表单并禁用保存：避免「取消后编辑框仍可见」的残留状态下
  // 再次点保存按新建处理、产生重复条目。
  const nameEl = document.getElementById(FILTER_EDITOR_NAME_ID);
  const regexEl = document.getElementById(FILTER_EDITOR_REGEX_ID);
  if (nameEl) nameEl.value = '';
  if (regexEl) regexEl.value = '';
  const validEl = document.getElementById(FILTER_EDITOR_VALID_ID);
  if (validEl) {
    validEl.textContent = '';
    validEl.dataset.state = 'idle';
  }
  const saveBtn = document.getElementById(FILTER_EDITOR_SAVE_ID);
  if (saveBtn) saveBtn.disabled = true;
}

function saveFilterEditor() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  const name = String(document.getElementById(FILTER_EDITOR_NAME_ID)?.value || '').trim();
  const raw = String(document.getElementById(FILTER_EDITOR_REGEX_ID)?.value || '').trim();
  let parsed;
  try {
    parsed = parseRegexLiteral(raw);
  } catch (error) {
    globalThis.toastr?.error?.(String(error?.message || error), '[' + MODULE_NAME + ']');
    validateFilterEditor();
    return;
  }
  if (!name) {
    globalThis.toastr?.warning?.('请填写名称', '[' + MODULE_NAME + ']');
    validateFilterEditor();
    return;
  }
  const list = getMessageFilterList(settings);
  if (filterEditingId) {
    const target = list.find((item) => item && item.id === filterEditingId);
    if (target) {
      target.name = name;
      target.pattern = parsed.pattern;
      target.flags = parsed.flags;
    }
  } else {
    list.push({ id: generateMessageFilterId(), name, pattern: parsed.pattern, flags: parsed.flags, enabled: true });
  }
  persistFilterList(ctx, list);
  closeFilterEditor();
  renderFilterList();
  logApp('info', '消息正则已保存', name, formatFilterRegex({ pattern: parsed.pattern, flags: parsed.flags }));
  globalThis.toastr?.success?.('正则「' + name + '」已保存', '[' + MODULE_NAME + ']');
}

async function deleteFilter(item) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const confirmed = await showConfirm('确定删除正则「' + item.name + '」？删除后不可恢复。');
  if (!confirmed) return;
  const settings = getSettings(ctx);
  const list = getMessageFilterList(settings);
  persistFilterList(ctx, list.filter((entry) => entry && entry.id !== item.id));
  renderFilterList();
  logApp('info', '消息正则已删除', item.name);
  globalThis.toastr?.info?.('正则「' + item.name + '」已删除', '[' + MODULE_NAME + ']');
}

function exportFilters() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  const list = getMessageFilterList(settings);
  const payload = {
    app: MODULE_NAME,
    version: MODULE_VERSION,
    exportedAt: new Date().toISOString(),
    count: list.length,
    filters: list.map((item) => ({ name: item.name, pattern: item.pattern, flags: item.flags, enabled: item.enabled !== false })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'soullink-message-filters-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (list.length === 0) {
    globalThis.toastr?.warning?.('暂无正则可导出', '[' + MODULE_NAME + ']');
  } else {
    globalThis.toastr?.success?.('已导出 ' + list.length + ' 条正则（JSON 文件）', '[' + MODULE_NAME + ']');
  }
}

function importFilters(file) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      let data = JSON.parse(String(reader.result || ''));
      let rawItems = data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        rawItems = data.filters || data.items || data.entries || [];
      }
      if (!Array.isArray(rawItems)) throw new Error('文件内容不是正则列表（应为数组，或含 filters/items 字段的对象）');
      const normalized = normalizeMessageFilterList(rawItems);
      if (normalized.length === 0) throw new Error('文件中没有可用的正则（需要 名称 + 表达式，且表达式可编译）');
      const settings = getSettings(ctx);
      const list = getMessageFilterList(settings);
      for (const item of normalized) {
        item.id = generateMessageFilterId(); // 导入一律分配新 id，避免覆盖现有条目
        list.push(item);
      }
      persistFilterList(ctx, list);
      renderFilterList();
      logApp('info', '消息正则已导入', normalized.length + ' 条');
      globalThis.toastr?.success?.('已导入 ' + normalized.length + ' 条正则', '[' + MODULE_NAME + ']');
    } catch (error) {
      globalThis.toastr?.error?.('导入失败：' + String(error?.message || error), '[' + MODULE_NAME + ']');
    }
  };
  reader.onerror = () => {
    globalThis.toastr?.error?.('读取文件失败', '[' + MODULE_NAME + ']');
  };
  reader.readAsText(file);
}

function initFilterSection(panel) {
  if (!panel || panel.dataset.filterReady === 'true') return;
  document.getElementById(FILTER_ADD_ID)?.addEventListener('click', () => openFilterEditor(null));
  document.getElementById(FILTER_EDITOR_CANCEL_ID)?.addEventListener('click', closeFilterEditor);
  document.getElementById(FILTER_EDITOR_SAVE_ID)?.addEventListener('click', saveFilterEditor);
  document.getElementById(FILTER_EDITOR_NAME_ID)?.addEventListener('input', validateFilterEditor);
  document.getElementById(FILTER_EDITOR_REGEX_ID)?.addEventListener('input', validateFilterEditor);
  document.getElementById(FILTER_EDITOR_REGEX_ID)?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !document.getElementById(FILTER_EDITOR_SAVE_ID)?.disabled) saveFilterEditor();
  });
  document.getElementById(FILTER_EXPORT_ID)?.addEventListener('click', exportFilters);
  document.getElementById(FILTER_IMPORT_ID)?.addEventListener('click', () => {
    document.getElementById(FILTER_IMPORT_FILE_ID)?.click();
  });
  document.getElementById(FILTER_IMPORT_FILE_ID)?.addEventListener('change', (event) => {
    const file = event.target?.files?.[0];
    if (file) importFilters(file);
    event.target.value = '';
  });
  document.getElementById(FILTER_LIST_ID)?.addEventListener('click', (event) => {
    const row = event.target.closest('.soullink-filter__row');
    if (!row) return;
    const settings = getFilterSettings();
    if (!settings) return;
    const item = getMessageFilterList(settings).find((entry) => entry && entry.id === row.dataset.filterId);
    if (!item) return;
    if (event.target.closest('.soullink-filter__action--danger')) {
      deleteFilter(item);
      return;
    }
    if (event.target.closest('.soullink-filter__action')) {
      openFilterEditor(item);
    }
  });
  document.getElementById(FILTER_LIST_ID)?.addEventListener('change', (event) => {
    const checkbox = event.target;
    if (!checkbox || checkbox.type !== 'checkbox') return;
    const row = checkbox.closest('.soullink-filter__row');
    const ctx = getContextSafe();
    if (!ctx || !row) return;
    const settings = getSettings(ctx);
    const item = getMessageFilterList(settings).find((entry) => entry && entry.id === row.dataset.filterId);
    if (!item) return;
    item.enabled = checkbox.checked;
    persistFilterList(ctx, getMessageFilterList(settings));
    renderFilterList();
  });
  renderFilterList();
  panel.dataset.filterReady = 'true';
  logApp('info', '正则过滤系统已就绪');
}
