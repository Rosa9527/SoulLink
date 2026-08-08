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

// v0.8.0 之前的默认提示词引用 world_info_background 输入字段（v0.8.0 起世界书改为
// 按位置注入 <World_Info_Before>/<World_Info_After> 块，该字段已从请求里移除）。
// 只要提示词仍引用它，就是过时文本：不升级的话模型会一直期待一个不存在的输入字段。
function isStalePromptText(text) {
  return typeof text === 'string'
    && (text.includes('world_info_background') || text.includes('<World_Info></World_Info>'));
}

// v0.8.1 起世界书注入新增 <World_Info_Extra> 块（AN/深度/示例/出口位置的触发条目）。
// 对 v0.8.0 默认提示词里描述标记块的两处旧文案做定点替换，保留用户其余自定义内容。
function migratePromptText(text) {
  if (typeof text !== 'string') return text;
  let next = text;
  next = next.replace(
    '输入内容的首尾可能带有 <World_Info_Before> 与 <World_Info_After> 标记块',
    '输入内容可能带有 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块',
  );
  next = next.replace(
    '可参照输入首尾的 <World_Info_Before> / <World_Info_After> 世界背景块',
    '可参照输入的 <World_Info_Before> / <World_Info_Extra> / <World_Info_After> 世界背景块',
  );
  // v0.8.4 起剧情消息从 JSON 输入的 recent_messages 字段移出，独立为 <Recent_Messages> 块，
  // 对旧默认文案里描述该字段的一行做定点替换，保留用户其余自定义内容。
  next = next.replace(
    '- recent_messages 是近期对话，可能包含该角色不在场的段落——你必须据此判断该角色是否真的能获知。',
    '- 输入消息里的 <Recent_Messages> 块是近期对话，可能包含该角色不在场的段落——你必须据此判断该角色是否真的能获知。',
  );
  // v0.8.6 起世界书中与角色同名的条目视为「本人设定卡」，可直接补全档案；
  // 对旧默认文案里「世界书仅作背景、只认对话获知」的五处描述做定点替换，保留用户其余自定义内容。
  next = next.replace(
    '档案应尽量完整：能从对话推断的标量字段与 MBTI 性格标签应及时补全，使 AI 能据此完整扮演该角色。',
    '档案应尽量完整：能从对话或其本人设定推断的标量字段与 MBTI 性格标签应及时补全，使 AI 能据此完整扮演该角色。',
  );
  // 该行在世界书注入重构前的旧默认里是「输入内容可能带有…」开头（v0.8.1 时代文案），
  // v0.8.4 默认改过开头但用户已保存的旧文案仍是旧开头，两种开头都迁移。
  next = next.replace(
    '- 输入内容可能带有 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致），\n  是背景补充信息；它们不代表该角色亲历或已知，仅供你了解世界观以便合理推断；\n  是否写入该角色记忆，仍须判断该角色是否真的亲历/被告知/目击。',
    '- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）\n  是世界书注入内容，条目通常以「<角色名>…</角色名>」形式分节。其中与 character 同名的条目是该角色本人的设定卡\n  （固有身份、家庭背景、性格、人际关系、世界观），是权威设定来源，可直接用于补全该角色档案；\n  其余条目只是背景信息，不代表该角色亲历或已知，仅供推断该角色可能获知/相信什么，\n  只有该角色确实获知（亲历/被告知/目击）的内容才可写入其档案。',
  );
  next = next.replace(
    '- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）\n  是世界书背景补充信息；它们不代表该角色亲历或已知，仅供你了解世界观以便合理推断；\n  是否写入该角色记忆，仍须判断该角色是否真的亲历/被告知/目击。',
    '- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）\n  是世界书注入内容，条目通常以「<角色名>…</角色名>」形式分节。其中与 character 同名的条目是该角色本人的设定卡\n  （固有身份、家庭背景、性格、人际关系、世界观），是权威设定来源，可直接用于补全该角色档案；\n  其余条目只是背景信息，不代表该角色亲历或已知，仅供推断该角色可能获知/相信什么，\n  只有该角色确实获知（亲历/被告知/目击）的内容才可写入其档案。',
  );
  next = next.replace(
    '- 标量字段（姓名/年龄/性别/职业）与 MBTI 性格标签一旦能从对话推断出，就应补全或更新，保证档案完整、可支撑角色扮演。',
    '- 标量字段（姓名/年龄/性别/职业）与 MBTI 性格标签一旦能从对话或其本人设定卡推断出，就应补全或更新，保证档案完整、可支撑角色扮演。',
  );
  next = next.replace(
    '- 记录世界观时，可参照输入的 <World_Info_Before> / <World_Info_Extra> / <World_Info_After> 世界背景块\n  判断哪些设定该角色已知或相信；但只有该角色确实获知（亲历/被告知/目击）的设定才应进入其世界观，\n  且应记录「该角色眼中的版本」——同一设定在不同角色眼中可以相信、怀疑、曲解或不知情。',
    '- 记录世界观时，该角色本人设定卡中描述的世界运转规则（社会秩序、认主体系、超自然设定、种族矛盾等）\n  可直接进入其世界观；其余世界书背景设定只有在该角色确实获知（亲历/被告知/目击）时才进入，\n  且应记录「该角色眼中的版本」——同一设定在不同角色眼中可以相信、怀疑、曲解或不知情。',
  );
  next = next.replace(
    '- 家庭背景/人际关系/记忆较稳定，仅在对话给出明确新信息时才新增或修改。',
    '- 家庭背景/人际关系以该角色本人设定卡为准，可直接补全；对话中明确出现的新信息也新增或更新；记忆仅记录该角色在对话中亲历/被告知/目击的事实。',
  );
  // v0.8.7 起世界书按三类处理：本人设定卡（权威）、普适世界设定（默认知晓，写入世界观）、
  // 其他角色私密信息（仅确实获知才写入）；对 v0.8.6 默认文案的两处描述做定点替换。
  next = next.replace(
    '- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）\n  是世界书注入内容，条目通常以「<角色名>…</角色名>」形式分节。其中与 character 同名的条目是该角色本人的设定卡\n  （固有身份、家庭背景、性格、人际关系、世界观），是权威设定来源，可直接用于补全该角色档案；\n  其余条目只是背景信息，不代表该角色亲历或已知，仅供推断该角色可能获知/相信什么，\n  只有该角色确实获知（亲历/被告知/目击）的内容才可写入其档案。',
    '- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）\n  是世界书注入内容，条目通常以「<角色名>…</角色名>」形式分节，按性质分三类：\n  ① 与 character 同名的条目是该角色本人的设定卡（固有身份、家庭背景、性格、人际关系、世界观），\n     是权威设定来源，可直接用于补全该角色档案；\n  ② 普适世界设定（社会秩序、认主体系、魔法/超自然规则、种族矛盾、组织规则等对所有人生效的规则）\n     是该角色作为世界一员默认知晓并相信的常识，应写入其世界观；\n  ③ 其他角色的个人条目与私密信息（其秘密、私事、内心想法、不在场经历）不代表该角色亲历或已知，\n     只有该角色确实获知（亲历/被告知/目击）的内容才可写入其档案。',
  );
  next = next.replace(
    '- 记录世界观时，该角色本人设定卡中描述的世界运转规则（社会秩序、认主体系、超自然设定、种族矛盾等）\n  可直接进入其世界观；其余世界书背景设定只有在该角色确实获知（亲历/被告知/目击）时才进入，\n  且应记录「该角色眼中的版本」——同一设定在不同角色眼中可以相信、怀疑、曲解或不知情。',
    '- 记录世界观时，来源有三：该角色本人设定卡中描述的世界运转规则、世界书中对所有人生效的普适世界设定、\n  以及该角色在对话中确实获知的新设定——前两者可直接进入其世界观，后者按获知情况写入；\n  其他角色的私密信息不得写入。记录「该角色眼中的版本」——同一设定在不同角色眼中可以相信、怀疑、曲解或不知情。',
  );
  return next;
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
  if (!settings.archives || typeof settings.archives !== 'object' || Array.isArray(settings.archives)) {
    settings.archives = {};
    shouldSave = true;
  }
  if (!settings.worldInfo || typeof settings.worldInfo !== 'object' || Array.isArray(settings.worldInfo)) {
    settings.worldInfo = { excluded: {} };
    shouldSave = true;
  } else if (!settings.worldInfo.excluded || typeof settings.worldInfo.excluded !== 'object' || Array.isArray(settings.worldInfo.excluded)) {
    settings.worldInfo.excluded = {};
    shouldSave = true;
  }
  if (!Array.isArray(settings.messageFilters)) {
    settings.messageFilters = cloneValue(MESSAGE_FILTERS_DEFAULT);
    shouldSave = true;
  } else {
    const normalizedFilters = normalizeMessageFilterList(settings.messageFilters);
    if (JSON.stringify(normalizedFilters) !== JSON.stringify(settings.messageFilters)) {
      settings.messageFilters = normalizedFilters;
      shouldSave = true;
    }
  }
  const prompts = settings.prompts;
  if (!prompts || typeof prompts !== 'object' || Array.isArray(prompts)) {
    settings.prompts = cloneValue(DEFAULT_PROMPTS);
    shouldSave = true;
  } else {
    for (const [key, value] of Object.entries(DEFAULT_PROMPTS)) {
      if (typeof prompts[key] !== 'string') {
        prompts[key] = value;
        shouldSave = true;
      } else if (key === 'archivePreScreen'
      && (prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN || prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN_V2 || prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN_V3 || prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN_V4 || prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN_V5 || prompts[key] === LEGACY_DEFAULT_ARCHIVE_PRESCREEN_V6)) {
      // v0.9.4 起「档案预筛」默认提示词输入说明同步为 <Registered_Characters> / <Recent_Messages>
      // 两个标签块（请求体已分段注入）；只有未自定义过（与旧默认逐字一致）才自动升级。
      prompts[key] = value;
      shouldSave = true;
      console.warn(`[${MODULE_NAME}] 提示词「档案预筛」已升级为 v1.0.9 新默认（最快返回 + 在场目击/信息补充必选，附和寒暄不列入）`);
    } else if (key === 'roleplayPreScreen'
      && (prompts[key] === LEGACY_DEFAULT_ROLEPLAY_PRESCREEN || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_PRESCREEN_V2 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_PRESCREEN_V3 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_PRESCREEN_V4)) {
      // v0.9.3 起「角色扮演预筛」默认提示词输入说明同步为 <Registered_Characters> / <Recent_Messages>
      // 两个标签块（请求体已分段注入）；只有未自定义过（与旧默认逐字一致）才自动升级。
      prompts[key] = value;
      shouldSave = true;
      console.warn(`[${MODULE_NAME}] 提示词「角色扮演预筛」已升级为 v1.0.8 新默认（在场受影响角色必选 + 戏份排序上限）`);
    } else if (key === 'roleplaySystem'
      && (prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM_V2 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM_V3 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM_V4 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM_V5 || prompts[key] === LEGACY_DEFAULT_ROLEPLAY_SYSTEM_V6)) {
      // v0.9.1 起整体重写（口吻/三要素/认知状态 + 风格示例），v0.9.2 起输入结构改为
      // <Character_Profile> 档案块 + <Recent_Messages> 剧情块分段注入；v1.0.8 起行为倾向推演重构
      // （推演流程 / 行动倾向具体化 / 质量红线 / 双示例）；v1.0.10 起改为
      // 「玩家已行动、聚焦反应」措辞（不再以推测玩家下一步为主任务）；v1.0.13 起措辞收尾修正
      // （术语统一 / 去重复 / 示例去总结腔 / 输入说明明确触发点）；只有未自定义过
      // （与任一旧版默认逐字一致）才自动升级。
      prompts[key] = value;
      shouldSave = true;
      console.warn(`[${MODULE_NAME}] 提示词「角色扮演」已升级为 v1.0.13 新默认（措辞收尾修正：术语统一 / 去重复 / 示例去总结腔 / 输入说明明确触发点）`);
    } else if (key === 'archiveSystem' && (prompts[key] === LEGACY_DEFAULT_ARCHIVE_SYSTEM || prompts[key] === LEGACY_DEFAULT_ARCHIVE_SYSTEM_V2)) {
      // v0.9.5 起「档案系统」默认提示词输出契约前置并强化 JSON 格式要求；只有未自定义过才自动升级。
      prompts[key] = value;
      shouldSave = true;
      console.warn(`[${MODULE_NAME}] 提示词「档案系统」已升级为 v0.9.5 新默认（输出契约前置 + JSON 格式强化）`);
    } else if (isStalePromptText(prompts[key])) {
        console.warn(`[${MODULE_NAME}] 提示词「${key}」引用已移除的 world_info_background 输入字段，已自动升级为新默认`);
        prompts[key] = value;
        shouldSave = true;
      } else {
        const migrated = migratePromptText(prompts[key]);
        if (migrated !== prompts[key]) {
          prompts[key] = migrated;
          shouldSave = true;
          console.warn(`[${MODULE_NAME}] 提示词「${key}」已升级：世界书注入新增 <World_Info_Extra> 块`);
        }
      }
    }
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

function buildHostProxyConfig(apiBase, settings, extraBody = null) {
  const apiKey = String(settings?.apiKey || '').trim();
  const config = {
    chat_completion_source: 'custom',
    custom_url: apiBase,
    reverse_proxy: apiBase,
    proxy_password: apiKey,
    custom_include_headers: apiKey ? `Authorization: Bearer ${apiKey}` : '',
  };
  if (extraBody && typeof extraBody === 'object') Object.assign(config, extraBody);
  return config;
}

function shouldFallbackFromHostProxy(responseText, status) {
  return status === 401
    || status === 403
    || status === 404
    || status === 405
    || /cannot\s+post|not\s+found|no\s+route|ENOENT/i.test(String(responseText || ''));
}

function looksLikeJson(text) {
  const trimmed = String(text || '').trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

// 检查响应文本里是否真的带有可用文本：content 为空但 reasoning_content 有内容时
// （deepseek-v4-flash 等模型偶发把答案写进思维链字段）仍视为可用；两者皆空才判
// 「等于没回复」，走直连与自动重试而不是直接判死；错误信封（{error}）不算缺内容，
// 交给上游错误分支处理。
function responseContainsUsableText(responseText) {
  const trimmed = String(responseText || '').trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return false;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (data.error) return true;
  if (data.response != null && data.choices == null) {
    try {
      const nested = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
      if (nested && typeof nested === 'object') data = nested;
    } catch {}
  }
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text;
  if (typeof content === 'string' && content.trim()) return true;
  // deepseek-v4-flash 等带思考能力的模型偶发把最终答案写进 reasoning_content、
  // content 留空（finish_reason=stop）——此时响应仍有可用文本，不应判为代理损坏。
  const reasoning = typeof choice?.message?.reasoning_content === 'string' ? choice.message.reasoning_content : '';
  return Boolean(reasoning.trim());
}

async function fetchText(url, options = {}) {
  const { timeoutMs, signal, ...fetchOptions } = options;
  const limitMs = Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_API_TIMEOUT_MS;
  const controller = limitMs > 0 && typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  let externalAbortHandler = null;
  if (controller) {
    // 超时信号与外部取消信号合并：支持 AbortSignal.any 时直接合并，
    // 否则把外部取消转发到超时控制器，保证两者都能中断 fetch。
    if (signal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
      fetchOptions.signal = AbortSignal.any([controller.signal, signal]);
    } else {
      fetchOptions.signal = controller.signal;
      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          externalAbortHandler = () => {
            try {
              controller.abort();
            } catch {}
          };
          signal.addEventListener('abort', externalAbortHandler, { once: true });
        }
      }
    }
    timer = setTimeout(() => {
      try {
        controller.abort();
      } catch {}
    }, limitMs);
  } else if (signal) {
    fetchOptions.signal = signal;
  }
  try {
    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    return { response, responseText };
  } finally {
    if (timer) clearTimeout(timer);
    if (externalAbortHandler && signal) signal.removeEventListener('abort', externalAbortHandler);
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

