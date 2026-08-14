function refreshHomeStatuses() {
  refreshHomeRegisterStatus();
  refreshHomeArchiveStatus();
  refreshHomeWorldBookStatus();
  refreshHomeRoundBadge();
}

function refreshHomeRegisterStatus() {
  const status = document.getElementById(HOME_REGISTER_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const roster = ctx ? getRoster(ctx) : {};
    const count = Object.keys(roster || {}).length;
    status.textContent = count > 0 ? `${count} 个角色` : '暂无角色';
    status.dataset.state = count > 0 ? 'ok' : 'idle';
  } catch (error) {
    status.textContent = '暂无角色';
    status.dataset.state = 'idle';
  }
}

function refreshHomeArchiveStatus() {
  const status = document.getElementById(HOME_ARCHIVE_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const roster = ctx ? getRoster(ctx) : {};
    const names = Object.keys(roster || {});
    const analyzed = names.filter((name) => roster[name]?.updatedAt).length;
    status.textContent = names.length > 0 ? `${analyzed}/${names.length} 已分析` : '暂无档案';
    status.dataset.state = analyzed > 0 ? 'ok' : 'idle';
  } catch (error) {
    status.textContent = '暂无档案';
    status.dataset.state = 'idle';
  }
}

function refreshChatBoundViews() {
  refreshHomeStatuses();
  const activeView = document.querySelector('.soullink-view.is-active');
  if (!activeView) return;
  if (activeView.id === REGISTER_VIEW_ID) {
    renderRegisterList();
    renderNpcDeductionToggle();
  }
  if (activeView.id === ARCHIVE_VIEW_ID) renderArchiveList();
  if (activeView.id === WORLDBOOK_VIEW_ID) renderWorldBookList();
  if (activeView.id === ROUND_VIEW_ID) renderRoundView();
}

// ---------- 剧情前置 NPC 推演：视图 UI ----------
function toggleNpcDeduction() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.npDeductionEnabled = !settings.npDeductionEnabled;
  saveSettings(ctx);
  logApp('info', settings.npDeductionEnabled ? '发送前角色推演已开启' : '发送前角色推演已关闭');
  globalThis.toastr?.info?.(`发送前角色推演已${settings.npDeductionEnabled ? '开启' : '关闭'}`, `[${MODULE_NAME}]`);
  renderNpcDeductionToggle();
}

function renderNpcDeductionToggle() {
  const status = document.getElementById(REGISTER_NPC_STATUS_ID);
  const toggle = document.getElementById(REGISTER_NPC_TOGGLE_ID);
  const ctx = getContextSafe();
  const enabled = ctx ? getSettings(ctx).npDeductionEnabled !== false : true;
  if (status) {
    status.textContent = enabled ? '已开启 · 发送前推演' : '已关闭 · 直接发送';
    status.dataset.state = enabled ? 'ok' : 'idle';
  }
  if (toggle) {
    toggle.classList.toggle('is-on', enabled);
    toggle.setAttribute('aria-checked', String(enabled));
    toggle.title = enabled ? '点击关闭发送前角色推演' : '点击开启发送前角色推演';
  }
}

// ---------- 上一轮角色扮演：首页入口与可视化 ----------
function describeRoundOutcome(round) {
  if (!round) return '尚无记录';
  if (round.injected) return '已注入 · ' + round.okNames.length + ' 个角色';
  if (round.timedOut) return '超时中止 · 未注入';
  if (round.skipped) return '未注入 · 本轮无角色';
  if (round.okNames.length > 0) return '未注入 · 宿主不支持注入';
  return '未注入 · 推演失败';
}

function refreshHomeRoundBadge() {
  const badge = document.getElementById(HOME_ROUND_BADGE_ID);
  const button = document.getElementById(HOME_ROUND_CARD_ID);
  const status = document.getElementById(HOME_ROUND_STATUS_ID);
  if (!badge || !button) return;
  const round = npcDeductionLastRound;
  if (!round) {
    badge.hidden = true;
    badge.dataset.state = 'idle';
    button.title = '查看上一轮角色扮演的结果（暂无记录）';
    if (status) {
      status.textContent = '暂无记录';
      status.dataset.state = 'idle';
    }
    return;
  }
  badge.hidden = false;
  badge.dataset.state = round.injected ? 'ok' : (round.timedOut ? 'warn' : (round.skipped ? 'idle' : 'error'));
  const parts = ['时间 ' + formatArchiveTime(round.at)];
  if (round.gateSelected.length) parts.push('预筛 ' + round.gateSelected.length + '/' + round.gateTotal);
  if (round.okNames.length) parts.push('成功 ' + round.okNames.length);
  if (round.failedNames.length) parts.push('失败 ' + round.failedNames.length);
  parts.push(describeRoundOutcome(round));
  button.title = '上一轮角色扮演 · ' + parts.join('，') + '（点击查看详情）';
  if (status) {
    status.textContent = describeRoundOutcome(round);
    status.dataset.state = badge.dataset.state;
  }
}

function buildRoundSummary(round) {
  const wrap = document.createElement('div');
  wrap.className = 'soullink-round__summary-inner';
  const outcome = document.createElement('span');
  outcome.className = 'soullink-round__outcome';
  outcome.dataset.state = round.injected ? 'ok' : (round.timedOut ? 'warn' : (round.skipped ? 'idle' : 'error'));
  outcome.textContent = describeRoundOutcome(round);
  const stats = document.createElement('div');
  stats.className = 'soullink-round__stats';
  const items = [
    ['时间', formatArchiveTime(round.at)],
    ['耗时', (round.durationMs / 1000).toFixed(1) + 's'],
    ['预筛', round.gateSelected.length + '/' + round.gateTotal],
    ['成功', String(round.okNames.length)],
    ['失败', String(round.failedNames.length)],
    ['跳过', String(round.skippedNames.length)],
  ];
  for (const item of items) {
    const stat = document.createElement('div');
    stat.className = 'soullink-round__stat';
    const label = document.createElement('span');
    label.className = 'soullink-round__stat-label';
    label.textContent = item[0];
    const value = document.createElement('span');
    value.className = 'soullink-round__stat-value';
    value.textContent = item[1];
    stat.append(label, value);
    stats.appendChild(stat);
  }
  const names = document.createElement('div');
  names.className = 'soullink-round__names';
  names.textContent = round.okNames.length > 0
    ? '角色：' + round.okNames.join('、')
    : (round.skipped ? '本轮预筛无角色有戏份' : '本轮没有成功推演的角色');
  wrap.append(outcome, stats, names);
  return wrap;
}

function buildRoundCharacterCard(item) {
  const card = document.createElement('div');
  card.className = 'soullink-round__character';
  const head = document.createElement('div');
  head.className = 'soullink-round__character-head';
  const name = document.createElement('span');
  name.className = 'soullink-round__character-name';
  name.textContent = item.name;
  const tag = document.createElement('span');
  tag.className = 'soullink-round__character-tag';
  tag.textContent = '内心独白';
  head.append(name, tag);
  const body = document.createElement('div');
  body.className = 'soullink-round__character-body';
  body.textContent = item.monologue;
  card.append(head, body);
  return card;
}

function renderRoundView() {
  const summary = document.getElementById(ROUND_SUMMARY_ID);
  const empty = document.getElementById(ROUND_EMPTY_ID);
  const gateHead = document.querySelector('.soullink-round__gate-head');
  const gateText = document.getElementById(ROUND_GATE_TEXT_ID);
  const charactersHead = document.querySelector('.soullink-round__characters-head');
  const characters = document.getElementById(ROUND_CHARACTERS_ID);
  const injectHead = document.querySelector('.soullink-round__inject-head');
  const injectText = document.getElementById(ROUND_INJECT_TEXT_ID);
  if (!summary || !empty || !gateHead || !gateText || !charactersHead || !characters || !injectHead || !injectText) return;
  const round = npcDeductionLastRound;
  if (!round) {
    summary.hidden = true;
    gateHead.hidden = true;
    gateText.hidden = true;
    charactersHead.hidden = true;
    characters.hidden = true;
    injectHead.hidden = true;
    injectText.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  summary.hidden = false;
  summary.textContent = '';
  summary.appendChild(buildRoundSummary(round));
  const hasGateRaw = Boolean(round.gateRaw);
  gateHead.hidden = !hasGateRaw;
  gateText.hidden = !hasGateRaw;
  gateText.textContent = round.gateRaw || '';
  const hasCharacters = round.characters.length > 0;
  charactersHead.hidden = !hasCharacters;
  characters.hidden = !hasCharacters;
  characters.textContent = '';
  for (const item of round.characters) {
    characters.appendChild(buildRoundCharacterCard(item));
  }
  const hasInjection = Boolean(round.injectionText);
  injectHead.hidden = !hasInjection;
  injectText.hidden = !hasInjection;
  injectText.textContent = round.injectionText || '';
}

async function copyRoundInjectionText() {
  const text = npcDeductionLastRound?.injectionText || '';
  if (!text) return;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    globalThis.toastr?.success?.('已复制推演注入提示词原文', '[' + MODULE_NAME + ']');
  } catch (error) {
    console.warn('[' + MODULE_NAME + '] 复制注入提示词失败', error);
    globalThis.toastr?.warning?.('推演原文复制失败，请手动选择文本', '[' + MODULE_NAME + ']');
  }
}
