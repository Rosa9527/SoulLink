function getContextSafe() {
  try {
    return globalThis.Luker?.getContext?.() || globalThis.SillyTavern?.getContext?.() || null;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] unable to read host context`, error);
    return null;
  }
}

// 宿主事件名 → ctx.event_types 键 的映射。
// TauriTavern 的 eventSource 需要 event_types 的值（如 ctx.event_types.GENERATION_ENDED），
// 裸字符串名（如 'generationEnded'）不会触发；标准 SillyTavern 的 event_types 值则是
// snake_case（如 'generation_ended'）。统一经 ctx.event_types 解析，取不到时回退原字符串。
const HOST_EVENT_TYPE_KEYS = Object.freeze({
  appReady: 'APP_READY',
  extensionsLoaded: 'EXTENSIONS_LOADED',
  settingsLoaded: 'SETTINGS_LOADED',
  chatChanged: 'CHAT_CHANGED',
  groupSelected: 'GROUP_SELECTED',
  messageSent: 'MESSAGE_SENT',
  messageReceived: 'MESSAGE_RECEIVED',
  streamStarted: 'STREAM_STARTED',
  streamEnded: 'STREAM_ENDED',
  generationStarted: 'GENERATION_STARTED',
  generationEnded: 'GENERATION_ENDED',
  generationStopped: 'GENERATION_STOPPED',
  messageDeleted: 'MESSAGE_DELETED',
  onlineStatusChanged: 'ONLINE_STATUS_CHANGED',
});

function resolveHostEventType(ctx, eventName) {
  const typeKey = HOST_EVENT_TYPE_KEYS[eventName];
  if (typeKey && ctx?.event_types && ctx.event_types[typeKey] !== undefined && ctx.event_types[typeKey] !== null) {
    return ctx.event_types[typeKey];
  }
  return eventName;
}

function onHostEvent(ctx, eventName, handler, key) {
  const eventSource = ctx?.eventSource;
  if (!eventSource || typeof eventSource.on !== 'function' || typeof handler !== 'function') return;
  const eventType = resolveHostEventType(ctx, eventName);
  if (globalThis[key] && typeof eventSource.removeListener === 'function') {
    eventSource.removeListener(eventType, globalThis[key]);
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
  eventSource.on(eventType, wrapped);
}
