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

// 宿主事件订阅统一入口：chatChanged / groupSelected / generationEnded。
// 事件源看门狗发现 ctx.eventSource 被宿主重建时，会重新调用本函数重挂订阅。
function installHostEventSubscriptions(ctx) {
  onHostEvent(ctx, 'chatChanged', refreshChatBoundViews, '__soullink_chat_changed_handler__');
  onHostEvent(ctx, 'groupSelected', refreshChatBoundViews, '__soullink_group_selected_handler__');
  onHostEvent(ctx, 'chatChanged', onFloorTraceChatChanged, FLOOR_TRACE_CHAT_HANDLER_KEY);
  onHostEvent(ctx, 'groupSelected', onFloorTraceChatChanged, FLOOR_TRACE_GROUP_HANDLER_KEY);
  onHostEvent(ctx, 'messageDeleted', onFloorTraceMessageDeleted, FLOOR_TRACE_DELETE_HANDLER_KEY);
  onHostEvent(ctx, 'generationStarted', onMainGenerationStarted, MAIN_GENERATION_STARTED_HANDLER_KEY);
  onHostEvent(ctx, 'generationStopped', onMainGenerationStopped, MAIN_GENERATION_STOPPED_HANDLER_KEY);
  onHostEvent(ctx, 'chatChanged', onMainGenerationChatChanged, MAIN_GENERATION_CHAT_CHANGED_HANDLER_KEY);
  onHostEvent(ctx, 'groupSelected', onMainGenerationChatChanged, MAIN_GENERATION_GROUP_SELECTED_HANDLER_KEY);
  onHostEvent(ctx, 'generationEnded', onAutoArchiveGenerationEnded, AUTO_ARCHIVE_END_HANDLER_KEY);
  onHostEvent(ctx, 'generationEnded', onNpcDeductionGenerationCleanup, NPC_CLEANUP_END_HANDLER_KEY);
  onHostEvent(ctx, 'generationStopped', onNpcDeductionGenerationCleanup, NPC_CLEANUP_STOP_HANDLER_KEY);
  installNpcDeductionMessageSentHook(ctx);
}

// 事件源自愈看门狗：TauriTavern 在主生成后可能重建 ctx.eventSource，导致 bootstrap 时
// 绑定到旧事件源的订阅成为孤儿——现象是「跑一次成功、之后全静默跳过，F5 重跑才复活」。
// 周期对比当前绑定事件源与宿主现时事件源的身份，一旦被换就重挂订阅（NPC Tracker 同款思路）。
function startHostEventWatchdog() {
  if (globalThis[HOST_EVENT_WATCHDOG_KEY]) {
    globalThis.clearInterval?.(globalThis[HOST_EVENT_WATCHDOG_KEY]);
  }
  let boundEventSource = getContextSafe()?.eventSource || null;
  globalThis[HOST_EVENT_WATCHDOG_KEY] = globalThis.setInterval(() => {
    try {
      const freshCtx = getContextSafe();
      const freshEventSource = freshCtx?.eventSource || null;
      if (boundEventSource && freshEventSource && boundEventSource !== freshEventSource) {
        logApp('warn', '宿主事件源已更换，重新绑定事件订阅');
        installHostEventSubscriptions(freshCtx);
        boundEventSource = freshEventSource;
      }
    } catch (error) {
      console.warn(`[${MODULE_NAME}] 事件源看门狗巡检失败`, error);
    }
  }, HOST_EVENT_WATCHDOG_INTERVAL_MS);
}

async function bootstrap() {
  if (globalThis[BOOTSTRAP_RUNTIME_KEY]) return;
  const ctx = getContextSafe();
  if (!ctx || !document.body) return;
  globalThis[BOOTSTRAP_RUNTIME_KEY] = true;
  try {
    initHostEventLogging();
    installHostEventSubscriptions(ctx);
    startHostEventWatchdog();
    ensureFloorTraceObserver();
    injectScribbleFilters();
    createPanel();
    createSphere();
    showSphere();
    await registerMenuItem();
    logApp('info', `扩展就绪 v${MODULE_VERSION}`, `generationEnded 事件: ${resolveHostEventType(ctx, 'generationEnded')}`);
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
