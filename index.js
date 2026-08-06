const MODULE_NAME = 'SoulLink';
const MODULE_VERSION = '0.8.9';

const PANEL_ID = 'soullink-panel';
const SPHERE_ID = 'soullink-floating-sphere';
const MENU_ITEM_ID = 'soullink-menu-item';
const MENU_API_ID = 'soullink-menu-api';
const MENU_ICON_CLASS = 'fa-solid fa-link';
const LOG_ICON_CLASS = 'fa-solid fa-scroll';
const PRESET_ICON_CLASS = 'fa-solid fa-file-lines';
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
const LOG_SOURCE_ID = 'soullink-log-source';
const LOG_NOISE_ID = 'soullink-log-noise';
const LOG_PAUSE_ID = 'soullink-log-pause';
const LOG_AUTOSCROLL_ID = 'soullink-log-autoscroll';
const LOG_CLEAR_ID = 'soullink-log-clear';
const LOG_COPY_ID = 'soullink-log-copy';
const LOG_EXPORT_ID = 'soullink-log-export';
const LOG_FULL_BODY_EXPORT_ID = 'soullink-log-fullbody-export';
const LOG_LIST_ID = 'soullink-log-list';
const LOG_BACK_ID = 'soullink-log-back-to-latest';
const LOG_STATUS_ID = 'soullink-log-status';
const LOG_PAUSED_ID = 'soullink-log-paused-badge';
const PRESET_VIEW_ID = 'soullink-preset-view';
const HOME_PRESET_CARD_ID = 'soullink-home-preset-card';
const HOME_PRESET_STATUS_ID = 'soullink-home-preset-status';
const PRESET_TABS_ID = 'soullink-preset-tabs';
const PRESET_TEXT_ID = 'soullink-preset-text';
const PRESET_SAVE_ID = 'soullink-preset-save';
const PRESET_RESET_ID = 'soullink-preset-reset';
const PRESET_STATUS_ID = 'soullink-preset-status';
const PRESET_COUNT_ID = 'soullink-preset-count';
const REGISTER_VIEW_ID = 'soullink-register-view';
const ARCHIVE_VIEW_ID = 'soullink-archive-view';
const REGISTER_ICON_CLASS = 'fa-solid fa-user-plus';
const ARCHIVE_ICON_CLASS = 'fa-solid fa-folder-open';
const HOME_REGISTER_CARD_ID = 'soullink-home-register-card';
const HOME_ARCHIVE_CARD_ID = 'soullink-home-archive-card';
const HOME_REGISTER_STATUS_ID = 'soullink-home-register-status';
const HOME_ARCHIVE_STATUS_ID = 'soullink-home-archive-status';
const REGISTER_INPUT_ID = 'soullink-register-input';
const REGISTER_ADD_ID = 'soullink-register-add';
const REGISTER_LIST_ID = 'soullink-register-list';
const REGISTER_STATUS_ID = 'soullink-register-status';
const REGISTER_CHAT_ID = 'soullink-register-chat';
const ARCHIVE_ANALYZE_ALL_ID = 'soullink-archive-analyze-all';
const AUTO_ARCHIVE_TOGGLE_ID = 'soullink-archive-auto-toggle';
const ARCHIVE_LIST_ID = 'soullink-archive-list';
const ARCHIVE_STATUS_ID = 'soullink-archive-status';
const ARCHIVE_CHAT_ID = 'soullink-archive-chat';
const WORLDBOOK_VIEW_ID = 'soullink-worldbook-view';
const WORLDBOOK_ICON_CLASS = 'fa-solid fa-book-bookmark';
const HOME_WORLDBOOK_CARD_ID = 'soullink-home-worldbook-card';
const HOME_WORLDBOOK_STATUS_ID = 'soullink-home-worldbook-status';
const WORLDBOOK_STATUS_ID = 'soullink-worldbook-status';
const WORLDBOOK_CHAT_ID = 'soullink-worldbook-chat';
const WORLDBOOK_REFRESH_ID = 'soullink-worldbook-refresh';
const WORLDBOOK_CLEAR_ID = 'soullink-worldbook-clear';
const WORLDBOOK_LIST_ID = 'soullink-worldbook-list';
const WORLDBOOK_BANNER_ID = 'soullink-worldbook-banner';
const WORLD_INFO_POSITION_LABELS = Object.freeze({
  before: '注入前',
  after: '注入后',
  an_top: 'AN 顶部',
  an_bottom: 'AN 底部',
  depth: '深度注入',
  em_top: '示例顶部',
  em_bottom: '示例底部',
  outlet: '出口',
});

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
const LOG_DETAIL_CAP = 20000;
const LOG_REQUEST_BODY_CAP = 6000;
const LOG_RESPONSE_BODY_CAP = 20000;
// 噪音过滤名单：console 噪音按消息前缀（debug/info 级别），network 噪音按 URL 模式。
// 只过滤 Tavern 内部刷屏（正则跳过 / 事件总线 / 世界书概率 / 元数据保存 / 非模型 IPC），
// warn/error、SoulLink 自身日志与模型 API 调用永不误伤。
const LOG_NOISE_PREFIXES = Object.freeze([
  '[WI]',
  '[Prompt Template]',
  'getRegexedString: Skipping script',
  'Event emitted: ',
  'WI entry ',
  'Chat Completions: saving token cache',
  'Saving metadata',
  'Saved metadata',
  'Debounced metadata save cancelled',
  '---calling setPromptString',
  'calling runGenerate',
  'generating prompt',
  'Auto-continue is disabled by user.',
  'Skipping extension interceptors for dry run',
  'Core/all messages:',
  'skipWIAN not active',
]);
const NETWORK_NOISE_PATTERNS = Object.freeze([
  /ipc\.localhost/,
  /\/api\/chats\//,
]);
const LOG_FULL_BODY_MAX = 5;
const CHAT_COMPLETION_TIMEOUT_MS = 60000;
const ARCHIVE_RECENT_MESSAGE_COUNT = 4;
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

const PRESET_DEFAULT_KEY = 'archiveSystem';
const PRESET_META = Object.freeze({
  archiveSystem: Object.freeze({ label: '档案系统', title: '档案系统提示词', description: '子 agent 依据近期对话维护指定角色的完整档案（标量字段 + 列表分节增量更新）。' }),
  archivePreScreen: Object.freeze({ label: '档案预筛', title: '档案预筛系统提示词', description: '子 agent 预筛本轮哪些已注册角色的信息或记忆会发生变化。' }),
  roleplaySystem: Object.freeze({ label: '角色扮演', title: '角色扮演系统提示词', description: '子 agent 以指定角色视角单独扮演，输出内心独白（含信息差与 NPC 行为逻辑）。' }),
  roleplayPreScreen: Object.freeze({ label: '角色扮演预筛', title: '角色扮演预筛系统提示词', description: '子 agent 预筛本轮哪些已注册角色会开口或有戏份。' }),
});

const ARCHIVE_SCALAR_FIELDS = Object.freeze(['name', 'age', 'gender', 'occupation']);
const ARCHIVE_SCALAR_LABELS = Object.freeze({ name: '姓名', age: '年龄', gender: '性别', occupation: '职业' });
const ARCHIVE_SECTIONS = Object.freeze([
  Object.freeze({ key: 'personality', label: '性格', prefix: 'p', hint: 'MBTI 类型标签，一行一个' }),
  Object.freeze({ key: 'worldview', label: '世界观', prefix: 'w', hint: '该角色眼中的世界运转规则，一条一行' }),
  Object.freeze({ key: 'family', label: '家庭背景', prefix: 'f', hint: '出身、家人、成长环境，一条一行' }),
  Object.freeze({ key: 'relationships', label: '人际关系', prefix: 'r', hint: '与谁是什么关系，一条一行' }),
  Object.freeze({ key: 'memory', label: '记忆', prefix: 'm', hint: '亲历 / 被告知 / 目击的事实，一条一行' }),
]);
const ARCHIVE_SECTION_KEYS = Object.freeze(ARCHIVE_SECTIONS.map((section) => section.key));
const ARCHIVE_DEFAULT_KEY = 'default';

const BOOTSTRAP_RUNTIME_KEY = '__soullink_bootstrapped__';
const MENU_RECOVERY_OBSERVER_KEY = '__soullink_menu_recovery_observer__';
const APP_READY_HANDLER_KEY = '__soullink_app_ready_handler__';
const ESC_KEY_HANDLER_KEY = '__soullink_esc_key_handler__';
const LOG_CAPTURE_KEY = '__soullink_log_capture__';
const LOG_EVENT_LOG_KEY = '__soullink_log_event_handler__';
const NETWORK_CAPTURE_KEY = '__soullink_network_capture__';
const AUTO_ARCHIVE_END_HANDLER_KEY = '__soullink_auto_archive_end_handler__';

const DEFAULT_PROMPTS = Object.freeze({
  archiveSystem: `你是角色档案裁判，职责是根据「指定角色」在近期对话中的表现与获知，维护该角色的完整档案。
你作为子 agent，必须**尽快**返回结果，因此要**精简步骤、控制篇幅**。
档案用于让 AI 依据它完成该角色的角色扮演；档案分两类字段：标量字段与列表分节。
档案应尽量完整：能从对话或其本人设定推断的标量字段与 MBTI 性格标签应及时补全，使 AI 能据此完整扮演该角色。

【档案结构】
- 标量字段（单值，直接覆盖）：name 姓名、age 年龄、gender 性别、occupation 职业。
- 列表分节（条目数组，增量维护）：
  - personality 性格：用四字母 MBTI 类型标签表示（如 INTP、ESFJ），每条即为一个标签；一个档案通常只保留一个最贴切的 MBTI 类型。
  - worldview 世界观：该角色已知/相信的关于这个世界运转的规则（魔法体系、社会结构、超自然设定、种族矛盾等）。
    记录详细度应随世界观偏离现实的程度而加大：世界观与现实差异越大，越要拆分成多条具体规则，
    把每一处「与现实常识不同」的设定都落到档案里，防止 AI 因默认套用现实世界的运转规则而演错设定。
  - family 家庭背景：出身、家人、成长环境等背景信息，每条一件事。
  - relationships 人际关系：与谁是什么关系，每条一段关系（如「与露比：挚友」）。
  - memory 记忆：该角色在对话中亲历、被告知或在场目击的事实。

【输入说明】
- character 是本轮要判断的角色名。
- current_profile 是该角色当前已记录的档案：标量字段为字符串，列表分节为条目数组（每项含 id 与 content）。
- 输入消息里的 <Recent_Messages> 块是近期对话，可能包含该角色不在场的段落——你必须据此判断该角色是否真的能获知。
- 输入消息里的 <World_Info_Before>、<World_Info_Extra> 与 <World_Info_After> 标记块（由 SillyTavern 世界书规则触发，位置与酒馆一致）
  是世界书注入内容，条目通常以「<角色名>…</角色名>」形式分节，按性质分三类：
  ① 与 character 同名的条目是该角色本人的设定卡（固有身份、家庭背景、性格、人际关系、世界观），
     是权威设定来源，可直接用于补全该角色档案；
  ② 普适世界设定（社会秩序、认主体系、魔法/超自然规则、种族矛盾、组织规则等对所有人生效的规则）
     是该角色作为世界一员默认知晓并相信的常识，应写入其世界观；
  ③ 其他角色的个人条目与私密信息（其秘密、私事、内心想法、不在场经历）不代表该角色亲历或已知，
     只有该角色确实获知（亲历/被告知/目击）的内容才可写入其档案。
- turn_index 是当前对话的消息索引，用于参考，无需输出。

【输出契约】
- 只输出一个可直接 JSON.parse 的 JSON 对象，不要输出 Markdown、\`\`\`json 或任何解释文字。
- 结构必须是：
  { "fields": { "age": "25 岁", "occupation": "主治医师" },
    "personality":   { "add": [...], "remove": [id...], "update": [{"id":"p1","content":"..."}] },
    "worldview":     { "add": [...], "remove": [...], "update": [...] },
    "family":        { "add": [...], "remove": [...], "update": [...] },
    "relationships": { "add": [...], "remove": [...], "update": [...] },
    "memory":        { "add": [...], "remove": [...], "update": [...] } }
- fields：本轮需要改写的标量字段，只放有变化的；未变化的字段省略。
- 各列表分节的 add/remove/update 含义：
  - add：本轮该角色档案里新增的条目，每条一句话、一件事，避免与同分节已有内容重复。
  - remove：已失效或不再成立的旧条目的 id（例如关系变化使旧条目失效）。
  - update：需要改写（补充或纠正）的旧条目，按 id 指定并给出新的 content。
- 同一事实不要既 add 又 update。
- 若本轮该角色档案没有任何变化，返回空对象 {}。
- 任意字段为空时可以省略该字段，或返回空数组。

【判断要点】
- 标量字段（姓名/年龄/性别/职业）与 MBTI 性格标签一旦能从对话或其本人设定卡推断出，就应补全或更新，保证档案完整、可支撑角色扮演。
- 性格只给一个四字母 MBTI 类型（如 INTP），不要写长句描述。
- 世界观是角色扮演是否贴合设定的关键：当世界观明显偏离现实（如存在魔法、超自然、异种生理、不同的社会规则或物理法则）时，
  应把每一条与「现实常识」不同的运转规则单独记为一条，宁可多拆几条，也不要浓缩成一句模糊的概括；
  世界观越是不同于现实，记录越要具体、详尽。现实向世界观可保持精简。
- 记录世界观时，来源有三：该角色本人设定卡中描述的世界运转规则、世界书中对所有人生效的普适世界设定、
  以及该角色在对话中确实获知的新设定——前两者可直接进入其世界观，后者按获知情况写入；
  其他角色的私密信息不得写入。记录「该角色眼中的版本」——同一设定在不同角色眼中可以相信、怀疑、曲解或不知情。
- 家庭背景/人际关系以该角色本人设定卡为准，可直接补全；对话中明确出现的新信息也新增或更新；记忆仅记录该角色在对话中亲历/被告知/目击的事实。
- 只在确有依据时才 add；依据模糊时倾向不新增。
- remove/update 要谨慎，只有在旧条目明显失效或需要纠正时才用。`,
  archivePreScreen: `你是角色档案预筛裁判，职责是判断本轮对话中「哪些已注册角色的信息或记忆会发生变化」。
你作为子 agent，必须**尽快**返回结果，因此要**精简步骤、控制篇幅**。

【输入说明】
- registered_characters 是当前全部已注册角色名单。
- recent_messages 是近期对话的最后几条，可能包含各角色不在场的段落——据此判断哪些角色本轮获得了新信息、新经历、或关系/背景发生了值得记录的变动。

【判断要点】
- 只列出本轮确实有值得写入或更新档案的新信息/新记忆的角色（例如亲历了事件、被告知了新事实、关系发生变化等）。
- 若某角色本轮没有任何新信息可记录，只是单纯登场或说话，不要列入。
- 拿不准时倾向不列入，宁少勿多。

【输出契约】
- 只输出一个可直接 JSON.parse 的 JSON 对象，不要输出 Markdown、\`\`\`json 或任何解释文字。
- 结构必须是：{ "characters": ["角色名", ...] }
- characters 必须是 registered_characters 中角色名的子集；本轮无角色信息变化时返回空数组 []。`,
  roleplaySystem: `你是角色扮演引擎，职责是单独扮演「指定角色」，输出该角色在当下场景中的内心独白。
你作为子 agent，必须**尽快**返回结果，因此要**精简步骤、控制篇幅**。
内心独白用于让主模型依据各角色当下的心理状态完成该角色的扮演；每个角色独立成章，只表达该角色自己的内心。

【角色沉浸要求】
- 以该角色的第一人称书写其内心独白，沉浸在该角色中，用内心独白分析剧情、规划回复。
- 在思考中先分析：我当前的身份是什么、我当下的处境如何、我对当前场景的判断是什么；
  再据此推演本轮的心情、想法与下一步行动。

【认知局限与信息差（最高优先级）】
- 该角色只能获知三样来源的信息：其档案（记忆/世界观/人际关系）、以及近期对话中它亲历、被告知或在场目击的内容。
  除此之外的信息对它是不可知的，一律不得使用。
- 角色之间刻意存在信息差：不同角色掌握不同信息，这本身是戏剧的核心。
- 该角色绝不能出现「全知」表现，尤其不得：
  - 知道它没有获知过的事实、事件或人物动机；
  - 知道其他角色的内心想法、秘密或不在场时发生的事；
  - 依赖对话外的作者设定、旁白或世界知识补齐它本不该知道的东西。
- 当该角色缺失某条信息时，必须真实地表现出相应的状态：困惑、猜测、误判、求证、或被蒙在鼓里，
  而不是绕过缺失直接知晓。宁可让它因信息不足而判断失误，也不要让它正确得异常。
- 该角色对信息的解读受其认知框架限制：同样的世界规则，不同身份/立场/经历的角色会用各自的方式理解，
  会相信、怀疑、曲解或无视它——据此呈现真实的认知局限，而不是中立客观地全盘接收。

<npc_behavior>
# NPC行为逻辑
- 信息局限：
  - 有什么：NPC有认知边界，只掌握部分情报与偏见。
  - 行为倾向：NPC会基于己方视角误判真相，并在获取新信息时修正立场。
- 性欲：
  - 有什么：NPC有自身的生理需求与性癖偏好，同时可能拥有固定、隐秘或复合的性伴侣关系。
  - 行为倾向：NPC会受性吸引主动接近目标；也会因伴侣关系产生利益捆绑与情感护短，甚至为了争夺伴侣或隐瞒地下情而做出妥协、撒谎与攻击行为。
- 逐利：
  - 有什么：NPC有想得到的目标和想保有的利益。
  - 行为倾向：NPC会权衡成本，为自身利益行动，在风险过大时妥协。
- 情感：
  - 有什么：NPC有独立的社交圈、情感需求和人际羁绊。
  - 行为倾向：NPC会寻求情感满足，为在意的人冒险或妥协；与其他NPC之间也会因情感恩怨形成拉帮结派、站队结盟或明争暗斗。
- 生活：
  - 有什么：NPC有独立的日常安排、作息规律和生活节奏。
  - 行为倾向：NPC会在特定时段出现在特定地点行事，若节奏被打断或计划被干扰，会产生相应的情绪波动与行动调整。
- 嫉妒：
  - 有什么：NPC有对他人优势（名利、才华、伴侣等）的攀比心与落差感。
  - 行为倾向：NPC会暗中较劲、言语贬低、设局打压，在利益冲突时优先阻碍其嫉妒对象，甚至表面逢迎背后捅刀。
- 选择性外向:
    规则: 社恐或内向的角色在熟人面前会彻底放松，熟人就是他们的情绪出口，必然变得外向且话多。
    举例: 对陌生人唯唯诺诺的社恐NPC，一见到玩家就立刻喋喋不休，甚至会因为玩家看了别人一眼而撒娇作闹、翻旧账。

# NPC冲突逻辑
- 内心冲突： 人物与自己思想/情感的斗争
- 个人冲突：人物与家人、恋人、朋友的斗争
- 个人外冲突：人物与社会、机构、自然、物理力量的斗争
**最强大的场景同时融合多个层面。**
</npc_behavior>

【输入说明】
- character 是本次要单独扮演的角色名。
- current_profile 是该角色当前已记录的档案（姓名/年龄/性别/职业 + 性格/世界观/家庭背景/人际关系/记忆），
  仅用于维持该角色的设定一致，不要输出其中的内容。
- 其中 worldview（世界观）分节记录该角色已知/相信的世界运转规则，扮演时必须据此推断该角色如何看待世界、
  什么对它而言是常识、什么对它而言是离奇或未知；不得让该角色拥有其 worldview 之外的全知设定。
- recent_messages 是近期对话，可能包含该角色不在场的段落——据此判断该角色当下真实能获知什么。

【输出契约】
- 只输出一个可直接 JSON.parse 的 JSON 对象，不要输出 Markdown、\`\`\`json 或任何解释文字。
- 结构必须是：{ "character": "角色名", "monologue": "该角色第一人称的内心独白" }
- monologue 必须是一段完整的内心独白，用该角色的口吻，包含三个要素：心情、想法、下一步行动；
  并体现该角色的信息盲区与认知框架。
- 只表达该角色自己的内心，不要输出其他角色的内容，不要输出旁白或系统设定。`,
  roleplayPreScreen: `你是角色扮演预筛裁判，职责是判断本轮对话中「哪些已注册角色会开口或有戏份」。
你作为子 agent，必须**尽快**返回结果，因此要**精简步骤、控制篇幅**。

【输入说明】
- registered_characters 是当前全部已注册角色名单。
- recent_messages 是近期对话的最后几条，可能包含各角色不在场的段落——据此判断每轮实际有谁登场、有谁被点名、有谁该回应。

【判断要点】
- 只列出本轮有开口、被直接点名、或明显有戏份（剧情需要其回应/参与）的角色。
- 若某角色没有戏份、只是被提及但不需要开口或参与，不要列入。
- 拿不准时倾向不列入，宁少勿多。

【输出契约】
- 只输出一个可直接 JSON.parse 的 JSON 对象，不要输出 Markdown、\`\`\`json 或任何解释文字。
- 结构必须是：{ "characters": ["角色名", ...] }
- characters 必须是 registered_characters 中角色名的子集；本轮无人有戏份时返回空数组 []。`,
});

const DEFAULT_SETTINGS = Object.freeze({
  apiUrl: '',
  apiKey: '',
  model: '',
  modelOptions: [],
  logMaxEntries: LOG_MAX_ENTRIES_DEFAULT,
  logAutoScroll: true,
  logConsoleNoise: true,
  prompts: DEFAULT_PROMPTS,
  autoArchiveEnabled: true,
  archives: {},
  worldInfo: { excluded: {} },
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
  const prompts = settings.prompts;
  if (!prompts || typeof prompts !== 'object' || Array.isArray(prompts)) {
    settings.prompts = cloneValue(DEFAULT_PROMPTS);
    shouldSave = true;
  } else {
    for (const [key, value] of Object.entries(DEFAULT_PROMPTS)) {
      if (typeof prompts[key] !== 'string') {
        prompts[key] = value;
        shouldSave = true;
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
  [PRESET_VIEW_ID]: '预设',
  [REGISTER_VIEW_ID]: '角色注册',
  [ARCHIVE_VIEW_ID]: '档案系统',
  [WORLDBOOK_VIEW_ID]: '世界书',
});
const PANEL_WIDE_MODES = Object.freeze({
  [LOG_VIEW_ID]: 'is-log-mode',
  [PRESET_VIEW_ID]: 'is-preset-mode',
  [ARCHIVE_VIEW_ID]: 'is-archive-mode',
  [WORLDBOOK_VIEW_ID]: 'is-worldbook-mode',
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
  document.getElementById(HOME_PRESET_CARD_ID)?.addEventListener('click', () => showPanelView(PRESET_VIEW_ID));
  document.getElementById(HOME_REGISTER_CARD_ID)?.addEventListener('click', () => showPanelView(REGISTER_VIEW_ID));
  document.getElementById(HOME_ARCHIVE_CARD_ID)?.addEventListener('click', () => showPanelView(ARCHIVE_VIEW_ID));
  document.getElementById(HOME_WORLDBOOK_CARD_ID)?.addEventListener('click', () => showPanelView(WORLDBOOK_VIEW_ID));
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
            <p class="soullink-api__hint">填入接口地址与 API Key 后点「连接并拉取模型」，再从列表选择模型；不支持模型列表的渠道可直接手动填写模型名称。</p>
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
              <button type="button" id="${LOG_AUTOSCROLL_ID}" class="soullink-log__action is-active" title="跟随：新日志自动滚动到底部（点一下关闭）">⏬ 跟随</button>
              <button type="button" id="${LOG_CLEAR_ID}" class="soullink-log__action" title="清空缓冲中的所有日志">🧹 清空</button>
              <button type="button" id="${LOG_COPY_ID}" class="soullink-log__action" title="复制全部日志为纯文本">📋 复制</button>
              <button type="button" id="${LOG_EXPORT_ID}" class="soullink-log__action" title="导出完整 JSON 日志文件">💾 导出</button>
              <button type="button" id="${LOG_FULL_BODY_EXPORT_ID}" class="soullink-log__action" title="导出最近 ${LOG_FULL_BODY_MAX} 次对话请求的完整请求体/响应体（未截断）">📦 完整请求体</button>
              <button type="button" id="${LOG_NOISE_ID}" class="soullink-log__action is-active" title="过滤已知噪音（世界书扫描 / 宏变量 dump / 正则跳过 / 事件总线 / 内部保存 / 非模型网络调用）">🔇 过滤噪音</button>
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
  initPresetSection(panel);
  initRegisterSection(panel);
  initArchiveSection(panel);
  initWorldBookSection(panel);
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
    const previous = wrappers[eventName];
    if (previous && typeof eventSource.removeListener === 'function') {
      eventSource.removeListener(eventName, previous);
    }
    const wrapped = (...args) => pushLogEntry('debug', 'event', [`[${eventName}]`, ...args]);
    wrappers[eventName] = wrapped;
    eventSource.on(eventName, wrapped);
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
    const capped = await readStreamText(cappedClone.body, LOG_RESPONSE_BODY_CAP);
    let full = '';
    if (isChatCompletionUrl(url)) {
      const fullClone = response.clone();
      full = redactSensitive(await readStreamFully(fullClone.body));
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
    paused.hidden = !logState.paused;
    if (logState.paused) paused.textContent = `已暂停 · 新增 +${logState.pausedCount}`;
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
    noiseToggle.title = logConsoleNoise ? '过滤已知噪音（世界书扫描 / 宏变量 dump / 正则跳过 / 事件总线 / 内部保存 / 非模型网络调用）' : '不过滤噪音（显示全部 console 与网络日志）';
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
      ? '跟随：新日志自动滚动到底部（点一下关闭）'
      : '已停止跟随：新日志仍追加，但不再自动滚动';
    if (logAutoScroll) scrollLogToBottom(document.getElementById(LOG_LIST_ID));
    const ctx = getCtx();
    if (ctx) {
      getSettings(ctx).logAutoScroll = logAutoScroll;
      saveSettings(ctx);
    }
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

function resetPreset(key) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const dirty = getPromptDirty(key);
  const text = getEditorText();
  if (dirty || text !== DEFAULT_PROMPTS[key]) {
    const what = dirty ? '未保存的修改' : '已保存的自定义内容';
    const confirmed = globalThis.confirm?.(`将「${PRESET_META[key].title}」恢复为默认内容？当前${what}将被默认内容覆盖。`);
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
initLogCapture();
exposeLogApi();
initNetworkCapture();

// ---------- 注册系统与档案系统：数据模型 ----------
const archiveAnalysisState = {}; // 角色名 -> { state: 'idle'|'busy'|'ok'|'error', message }
const archiveEditState = {};     // 角色名 -> true（处于编辑态）

function getCurrentChatKey(ctx) {
  if (!ctx) return ARCHIVE_DEFAULT_KEY;
  if (ctx.chatId) return String(ctx.chatId);
  const characterId = ctx.characterId !== undefined && ctx.characterId !== null ? String(ctx.characterId) : 'npc';
  const groupId = ctx.groupId !== undefined && ctx.groupId !== null ? String(ctx.groupId) : '';
  return groupId ? `g${groupId}` : characterId;
}

function getCurrentChatLabel(ctx) {
  if (!ctx) return '未绑定聊天';
  return String(ctx.chatTitle || getCurrentChatKey(ctx));
}

function getArchiveStore(ctx) {
  const settings = ctx ? getSettings(ctx) : null;
  if (!settings) return null;
  const chatKey = getCurrentChatKey(ctx);
  if (!settings.archives[chatKey] || typeof settings.archives[chatKey] !== 'object' || Array.isArray(settings.archives[chatKey])) {
    settings.archives[chatKey] = {};
  }
  return settings.archives[chatKey];
}

function getRoster(ctx) {
  return getArchiveStore(ctx);
}

function getArchiveForRender(name) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  return roster?.[name] || null;
}

function createEmptyArchive(name) {
  return {
    fields: { name: String(name || ''), age: '', gender: '', occupation: '' },
    personality: [],
    worldview: [],
    family: [],
    relationships: [],
    memory: [],
    updatedAt: 0,
  };
}

// ---------- 注册系统：视图 UI ----------
function registerCharacter(name) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    globalThis.toastr?.warning?.('请输入角色名字', `[${MODULE_NAME}]`);
    return;
  }
  const roster = getRoster(ctx);
  if (!roster) return;
  if (roster[trimmed]) {
    globalThis.toastr?.warning?.(`「${trimmed}」已在名单中`, `[${MODULE_NAME}]`);
    return;
  }
  roster[trimmed] = createEmptyArchive(trimmed);
  saveSettingsImmediate(ctx);
  logApp('info', '角色已注册', trimmed);
  globalThis.toastr?.success?.(`「${trimmed}」已加入名单`, `[${MODULE_NAME}]`);
  renderRegisterList();
  renderArchiveList();
  refreshHomeStatuses();
}

function unregisterCharacter(name) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const roster = getRoster(ctx);
  if (!roster || !roster[name]) return;
  const confirmed = globalThis.confirm?.(`确定注销「${name}」？该角色的档案数据将被删除。`);
  if (!confirmed) return;
  cancelCharacterAnalysis(name);
  delete roster[name];
  saveSettingsImmediate(ctx);
  logApp('info', '角色已注销', name);
  globalThis.toastr?.info?.(`「${name}」已注销`, `[${MODULE_NAME}]`);
  renderRegisterList();
  renderArchiveList();
  refreshHomeStatuses();
}

function renderRegisterList() {
  const list = document.getElementById(REGISTER_LIST_ID);
  if (!list) return;
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {}).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const status = document.getElementById(REGISTER_STATUS_ID);
  if (status) status.textContent = `${names.length} 个角色`;
  const chatNode = document.getElementById(REGISTER_CHAT_ID);
  if (chatNode) chatNode.textContent = `绑定聊天：${getCurrentChatLabel(ctx)}`;
  list.textContent = '';
  if (names.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-register__empty';
    empty.textContent = '还没有注册任何角色 —— 输入名字即可加入名单。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const name of names) {
    const item = document.createElement('div');
    item.className = 'soullink-register__item';
    const nameNode = document.createElement('span');
    nameNode.className = 'soullink-register__item-name';
    nameNode.textContent = name;
    const unregister = document.createElement('button');
    unregister.type = 'button';
    unregister.className = 'soullink-register__unregister';
    unregister.textContent = '注销';
    unregister.title = `注销「${name}」并删除其档案数据`;
    unregister.addEventListener('click', () => unregisterCharacter(name));
    item.append(nameNode, unregister);
    fragment.appendChild(item);
  }
  list.appendChild(fragment);
}

function initRegisterSection(panel) {
  if (!panel || panel.dataset.registerReady === 'true') return;
  const submit = () => {
    const input = document.getElementById(REGISTER_INPUT_ID);
    registerCharacter(input?.value || '');
    if (input) input.value = '';
    input?.focus?.();
  };
  document.getElementById(REGISTER_ADD_ID)?.addEventListener('click', submit);
  document.getElementById(REGISTER_INPUT_ID)?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  });
  renderRegisterList();
  panel.dataset.registerReady = 'true';
  logApp('info', '注册系统已就绪');
}

// ---------- 档案系统：视图 UI ----------
function formatArchiveTime(timestamp) {
  if (!timestamp) return '尚未分析';
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function findArchiveCard(name) {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return null;
  for (const card of list.querySelectorAll('.soullink-archive__card')) {
    if (card.dataset.name === name) return card;
  }
  return null;
}

function renderArchiveCard(name) {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return;
  const archive = getArchiveForRender(name);
  if (!archive) {
    findArchiveCard(name)?.remove();
    return;
  }
  const built = buildArchiveCard(name, archive);
  const existing = findArchiveCard(name);
  if (existing) existing.replaceWith(built);
  else list.appendChild(built);
}

function buildArchiveCard(name, archive) {
  const card = document.createElement('div');
  card.className = 'soullink-archive__card';
  card.dataset.name = name;

  const head = document.createElement('div');
  head.className = 'soullink-archive__card-head';
  const nameNode = document.createElement('span');
  nameNode.className = 'soullink-archive__card-name';
  nameNode.textContent = name;

  const state = archiveAnalysisState[name] || { state: 'idle', message: '' };
  const status = document.createElement('span');
  status.className = 'soullink-archive__status';
  status.dataset.state = state.state;
  status.textContent = state.message || '待分析';

  const analyzeBtn = document.createElement('button');
  analyzeBtn.type = 'button';
  analyzeBtn.className = 'soullink-archive__analyze';
  const busy = state.state === 'busy';
  analyzeBtn.classList.toggle('is-cancelling', busy);
  analyzeBtn.textContent = busy ? '⏹ 取消分析角色' : '🔮 分析本角色';
  analyzeBtn.title = busy ? '点击中断该角色的分析请求' : '用最近对话配合「档案系统」提示词更新该角色档案';
  analyzeBtn.addEventListener('click', () => {
    if (archiveAnalysisState[name]?.state === 'busy') cancelCharacterAnalysis(name);
    else analyzeCharacter(name);
  });

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'soullink-archive__edit';
  editBtn.textContent = archiveEditState[name] ? '✏️ 编辑中' : '✏️ 编辑';
  editBtn.addEventListener('click', () => toggleArchiveEdit(name));

  head.append(nameNode, status, analyzeBtn, editBtn);
  card.appendChild(head);
  card.appendChild(archiveEditState[name]
    ? buildArchiveEditBody(name, archive)
    : buildArchiveDisplayBody(archive));
  return card;
}

function buildArchiveDisplayBody(archive) {
  const body = document.createElement('div');
  body.className = 'soullink-archive__body';

  const fields = document.createElement('div');
  fields.className = 'soullink-archive__fields';
  for (const key of ARCHIVE_SCALAR_FIELDS) {
    const field = document.createElement('div');
    field.className = 'soullink-archive__field';
    const label = document.createElement('span');
    label.className = 'soullink-archive__field-label';
    label.textContent = ARCHIVE_SCALAR_LABELS[key];
    const value = document.createElement('span');
    value.className = 'soullink-archive__field-value';
    value.textContent = String(archive.fields[key] || '');
    if (!value.textContent) value.classList.add('is-empty');
    field.append(label, value);
    fields.appendChild(field);
  }
  body.appendChild(fields);

  for (const section of ARCHIVE_SECTIONS) {
    const block = document.createElement('div');
    block.className = 'soullink-archive__section';
    const title = document.createElement('div');
    title.className = 'soullink-archive__section-title';
    title.textContent = section.label;
    block.appendChild(title);
    const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'soullink-archive__section-empty';
      empty.textContent = '（暂无）';
      block.appendChild(empty);
    } else {
      const list = document.createElement('ul');
      list.className = 'soullink-archive__section-items';
      for (const item of items) {
        const li = document.createElement('li');
        li.className = 'soullink-archive__section-item';
        li.textContent = String(item.content || '');
        list.appendChild(li);
      }
      block.appendChild(list);
    }
    body.appendChild(block);
  }

  const meta = document.createElement('div');
  meta.className = 'soullink-archive__meta';
  meta.textContent = `最后更新：${formatArchiveTime(archive.updatedAt)}`;
  body.appendChild(meta);
  return body;
}

function buildArchiveEditBody(name, archive) {
  const body = document.createElement('div');
  body.className = 'soullink-archive__body';

  const fields = document.createElement('div');
  fields.className = 'soullink-archive__fields';
  for (const key of ARCHIVE_SCALAR_FIELDS) {
    const field = document.createElement('label');
    field.className = 'soullink-archive__field soullink-archive__field--edit';
    const label = document.createElement('span');
    label.className = 'soullink-archive__field-label';
    label.textContent = ARCHIVE_SCALAR_LABELS[key];
    const input = document.createElement('input');
    input.className = 'soullink-input';
    input.type = 'text';
    input.value = String(archive.fields[key] || '');
    input.dataset.fieldKey = key;
    input.placeholder = `填写${ARCHIVE_SCALAR_LABELS[key]}…`;
    field.append(label, input);
    fields.appendChild(field);
  }
  body.appendChild(fields);

  for (const section of ARCHIVE_SECTIONS) {
    const block = document.createElement('div');
    block.className = 'soullink-archive__section';
    const title = document.createElement('div');
    title.className = 'soullink-archive__section-title';
    title.textContent = section.label;
    const textarea = document.createElement('textarea');
    textarea.className = 'soullink-input soullink-archive__section-edit';
    textarea.dataset.sectionKey = section.key;
    textarea.placeholder = section.hint;
    const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
    textarea.value = items.map((item) => item.content).join('\n');
    block.append(title, textarea);
    body.appendChild(block);
  }

  const actions = document.createElement('div');
  actions.className = 'soullink-archive__edit-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'soullink-btn soullink-btn--ghost';
  cancel.textContent = '取消';
  cancel.addEventListener('click', () => {
    delete archiveEditState[name];
    renderArchiveCard(name);
  });
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'soullink-btn';
  save.textContent = '💾 保存修改';
  save.addEventListener('click', () => saveArchiveEdit(name, body));
  actions.append(cancel, save);
  body.appendChild(actions);
  return body;
}

function toggleArchiveEdit(name) {
  if (!getArchiveForRender(name)) return;
  if (archiveEditState[name]) delete archiveEditState[name];
  else archiveEditState[name] = true;
  renderArchiveCard(name);
}

function saveArchiveEdit(name, body) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : null;
  const archive = roster?.[name];
  if (!roster || !archive) return;
  body.querySelectorAll('input[data-field-key]').forEach((input) => {
    const key = input.dataset.fieldKey;
    if (ARCHIVE_SCALAR_FIELDS.includes(key)) archive.fields[key] = input.value.trim();
  });
  body.querySelectorAll('textarea[data-section-key]').forEach((textarea) => {
    const key = textarea.dataset.sectionKey;
    if (ARCHIVE_SECTION_KEYS.includes(key)) {
      archive[key] = rebuildSectionItems(archive[key], textarea.value);
    }
  });
  archive.updatedAt = Date.now();
  delete archiveEditState[name];
  saveSettingsImmediate(ctx);
  logApp('info', '档案已手动修改', name);
  globalThis.toastr?.success?.(`「${name}」档案已保存`, `[${MODULE_NAME}]`);
  renderArchiveCard(name);
  refreshHomeStatuses();
}

function rebuildSectionItems(items, text) {
  const source = Array.isArray(items) ? items : [];
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const used = new Set();
  const next = [];
  for (const line of lines) {
    let matched = null;
    for (let i = 0; i < source.length; i += 1) {
      if (used.has(i)) continue;
      if (String(source[i].content || '') === line) {
        matched = source[i];
        used.add(i);
        break;
      }
    }
    if (matched) next.push(matched);
    else next.push({ id: nextSectionItemId(null, next), content: line });
  }
  return next;
}

function nextSectionItemId(section, items) {
  let max = 0;
  for (const item of items) {
    const match = String(item.id || '').match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${section ? section.prefix : 'i'}${max + 1}`;
}

function renderArchiveList() {
  const list = document.getElementById(ARCHIVE_LIST_ID);
  if (!list) return;
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {}).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  const chatNode = document.getElementById(ARCHIVE_CHAT_ID);
  if (chatNode) chatNode.textContent = `绑定聊天：${getCurrentChatLabel(ctx)}`;
  const status = document.getElementById(ARCHIVE_STATUS_ID);
  if (status) status.textContent = `${names.length} 个档案`;
  renderAnalyzeAllButton();
  list.textContent = '';
  if (names.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-archive__empty';
    empty.textContent = '名单还是空的 —— 先去「角色注册」注册角色吧。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const name of names) fragment.appendChild(buildArchiveCard(name, roster[name]));
  list.appendChild(fragment);
}

function isAnyAnalysisBusy() {
  return Object.values(archiveAnalysisState).some((state) => state?.state === 'busy');
}

function renderAnalyzeAllButton() {
  const button = document.getElementById(ARCHIVE_ANALYZE_ALL_ID);
  if (!button) return;
  button.textContent = isAnyAnalysisBusy() ? '⏹ 取消分析全部角色' : '🔮 分析全部角色';
}

function cancelCharacterAnalysis(name) {
  const state = archiveAnalysisState[name];
  if (!state || state.state !== 'busy') return;
  try {
    state.controller?.abort?.();
  } catch {}
  archiveAnalysisState[name] = { state: 'cancelled', message: '已取消' };
  renderArchiveCard(name);
  renderAnalyzeAllButton();
  refreshHomeStatuses();
  logApp('info', '取消角色分析', name);
}

async function analyzeAllCharacters() {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : {};
  const names = Object.keys(roster || {});
  if (names.length === 0) {
    globalThis.toastr?.warning?.('名单里还没有角色', `[${MODULE_NAME}]`);
    return;
  }
  if (isAnyAnalysisBusy()) {
    // 「取消分析全部角色」：中断所有在途的角色分析
    for (const name of names) cancelCharacterAnalysis(name);
    logApp('info', '取消全部角色分析');
    globalThis.toastr?.info?.('已取消全部角色分析', `[${MODULE_NAME}]`);
    return;
  }
  const results = await Promise.allSettled(names.map((name) => analyzeCharacter(name)));
  const counts = { ok: 0, error: 0, cancelled: 0, skipped: 0, busy: 0 };
  for (const result of results) {
    const outcome = result.status === 'fulfilled' ? String(result.value || 'ok') : 'error';
    counts[outcome] = (counts[outcome] || 0) + 1;
  }
  const parts = [];
  if (counts.ok > 0) parts.push(`${counts.ok} 成功`);
  if (counts.error > 0) parts.push(`${counts.error} 失败`);
  if (counts.cancelled > 0) parts.push(`${counts.cancelled} 取消`);
  if (counts.busy > 0) parts.push(`${counts.busy} 进行中`);
  logApp('info', '全部角色分析结束', parts.join('，') || '无角色可分析');
  if (counts.error > 0) {
    globalThis.toastr?.warning?.(`分析完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else if (counts.cancelled > 0 && counts.ok === 0) {
    globalThis.toastr?.info?.(`分析已取消：${parts.join('，')}`, `[${MODULE_NAME}]`);
  } else {
    globalThis.toastr?.success?.(`分析完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
  }
  renderAnalyzeAllButton();
}

function renderAutoArchiveToggle() {
  const button = document.getElementById(AUTO_ARCHIVE_TOGGLE_ID);
  if (!button) return;
  const ctx = getContextSafe();
  const enabled = ctx ? getSettings(ctx).autoArchiveEnabled !== false : true;
  button.textContent = enabled ? '⚡ 自动维护：开' : '⚡ 自动维护：关';
  button.classList.toggle('is-active', enabled);
  button.title = enabled ? '点击关闭自动档案维护' : '点击开启自动档案维护';
}

function toggleAutoArchive() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.autoArchiveEnabled = !settings.autoArchiveEnabled;
  saveSettingsImmediate(ctx);
  renderAutoArchiveToggle();
  logApp('info', settings.autoArchiveEnabled ? '自动档案维护已开启' : '自动档案维护已关闭');
  globalThis.toastr?.info?.(`自动档案维护已${settings.autoArchiveEnabled ? '开启' : '关闭'}`, `[${MODULE_NAME}]`);
}

function initArchiveSection(panel) {
  if (!panel || panel.dataset.archiveReady === 'true') return;
  document.getElementById(ARCHIVE_ANALYZE_ALL_ID)?.addEventListener('click', analyzeAllCharacters);
  document.getElementById(AUTO_ARCHIVE_TOGGLE_ID)?.addEventListener('click', toggleAutoArchive);
  renderAutoArchiveToggle();
  renderAnalyzeAllButton();
  renderArchiveList();
  panel.dataset.archiveReady = 'true';
  logApp('info', '档案系统已就绪');
}

function refreshHomeStatuses() {
  refreshHomeRegisterStatus();
  refreshHomeArchiveStatus();
  refreshHomeWorldBookStatus();
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
  if (activeView.id === REGISTER_VIEW_ID) renderRegisterList();
  if (activeView.id === ARCHIVE_VIEW_ID) renderArchiveList();
  if (activeView.id === WORLDBOOK_VIEW_ID) renderWorldBookList();
}

// ---------- 档案分析：AI 调用 ----------
function getRecentMessages(count) {
  const ctx = getContextSafe();
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  return chat.slice(-count).map((message) => ({
    role: message?.is_user ? 'user' : (message?.is_system ? 'system' : 'assistant'),
    name: String(message?.name || ''),
    content: String(message?.mes || ''),
  }));
}

// ---------- 世界书系统 ----------
// 触发规则完全交给 SillyTavern：ctx.getWorldInfoPrompt 是酒馆自己的世界书引擎
// （扫描深度 / 递归扫描 / 概率 / 预算 / 粘性冷却等全部由它决定），本程序只负责
// 「读取激活结果 → 按排除名单过滤 → 按酒馆的 before/after 位置注入」。
// TauriTavern 的 getWorldInfoPrompt 会额外返回 worldInfoActivation.entries
// （每个触发条目的 world+uid 稳定身份、内容与位置），这是「按条目排除」的基础；
// 未提供该字段的宿主降级为「原样注入酒馆拼好的文本」，条目排除不可用。
// 注意：绝不自己实现触发规则——按关键词自己过滤就是隔壁 NPC Tracker 的降级路径，
// 那会绕过酒馆的概率 / 预算 / 递归 / 粘性冷却等语义，属于要避免的设计。

function getStWorldInfoIncludeNames() {
  // 酒馆「世界书扫描包含角色名前缀」的设置（默认开启）。设置面板常驻 DOM 时读实时值。
  const checkbox = document.getElementById('world_info_include_names');
  if (checkbox && typeof checkbox.checked === 'boolean') return checkbox.checked;
  return true;
}

// 与酒馆生成时构造扫描 chat 的方式一致：非 system 消息、可选 name 前缀、最新在前。
// 注意：必须是「最新在前」，NPC Tracker 传正序 chat 会让触发扫描作用在旧消息上。
function buildWorldInfoScanChat(ctx) {
  const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
  const includeNames = getStWorldInfoIncludeNames();
  const lines = [];
  for (const message of chat) {
    if (!message || message.is_system) continue;
    const text = String(message.mes || '').trim();
    if (!text) continue;
    const name = String(message.name || '').trim();
    lines.push(includeNames && name ? `${name}: ${text}` : text);
  }
  return lines.reverse();
}

// 与酒馆生成时构造 globalScanData 的方式一致（见 ST generateRawData）：角色卡字段
// （描述/性格/深度提示/场景/创作备注）+ 当前 persona，供「匹配角色描述 / 匹配场景」等
// 触发条件使用；trigger 固定为 normal，对应普通生成（GENERATION_TYPE_TRIGGERS 包含 normal）。
function buildWorldInfoGlobalScanData(ctx) {
  const scanData = {
    personaDescription: '',
    characterDescription: '',
    characterPersonality: '',
    characterDepthPrompt: '',
    scenario: '',
    creatorNotes: '',
    trigger: 'normal',
  };
  if (!ctx || typeof ctx.getCharacterCardFields !== 'function') return scanData;
  try {
    const fields = ctx.getCharacterCardFields() || {};
    scanData.personaDescription = String(fields.persona ?? '');
    scanData.characterDescription = String(fields.description ?? '');
    scanData.characterPersonality = String(fields.personality ?? '');
    scanData.characterDepthPrompt = String(fields.charDepthPrompt ?? '');
    scanData.scenario = String(fields.scenario ?? '');
    scanData.creatorNotes = String(fields.creatorNotes ?? '');
  } catch (error) {
    console.warn(`[${MODULE_NAME}] getCharacterCardFields failed`, error);
  }
  return scanData;
}

async function getStWorldInfoActivation(ctx) {
  if (!ctx || typeof ctx.getWorldInfoPrompt !== 'function') return null;
  try {
    const scanChat = buildWorldInfoScanChat(ctx);
    const maxContext = Number(ctx.maxContext) || 0;
    // 第三参传 true 表示 dry run：只计算激活结果，不派发 WORLD_INFO_ACTIVATED 等副作用事件。
    // 第四参 globalScanData 必须传：TauriTavern 的 getWorldInfoPrompt 会直接读
    // globalScanData.trigger 组装 worldInfoActivation，不传会在其内部抛
    // "Cannot read properties of undefined (reading 'trigger')"，导致整个世界书系统静默降级。
    const result = await ctx.getWorldInfoPrompt(
      scanChat,
      maxContext > 0 ? maxContext : undefined,
      true,
      buildWorldInfoGlobalScanData(ctx),
    );
    return result && typeof result === 'object' ? result : null;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] getWorldInfoPrompt failed`, error);
    return null;
  }
}

// 排除名单的身份键：书名 + 条目 uid（酒馆自己的稳定身份），
// 不用显示名——显示名可能重复 / 被改写，NPC Tracker 的「书名 :: 条目名」匹配
// 还需要 sanitize 各种脏数据，属于不必要的脆弱设计。
function worldInfoEntryKey(bookName, uid) {
  return `${String(bookName || '').trim()}\u0000${String(uid ?? '').trim()}`;
}

function getWorldInfoExcludedKeys(settings) {
  const keys = new Set();
  const excluded = settings?.worldInfo?.excluded;
  if (!excluded || typeof excluded !== 'object') return keys;
  for (const [bookName, uids] of Object.entries(excluded)) {
    if (!bookName || !Array.isArray(uids)) continue;
    for (const uid of uids) {
      if (uid !== undefined && uid !== null && uid !== '') keys.add(worldInfoEntryKey(bookName, uid));
    }
  }
  return keys;
}

function isWorldInfoEntryExcluded(excludedKeys, entry) {
  if (!excludedKeys || excludedKeys.size === 0) return false;
  const world = String(entry?.world || '').trim();
  const uid = String(entry?.uid ?? '').trim();
  if (!world || !uid) return false;
  return excludedKeys.has(worldInfoEntryKey(world, uid));
}

function normalizeWorldInfoPosition(position) {
  // TauriTavern 的 worldInfoActivation.entries 里 position 已是字符串名（before/after/...），
  // loadWorldInfo 的原始书条目里是数字（0-7），两种都要兼容。
  if (position === 'before' || position === 'after' || position === 'an_top'
    || position === 'an_bottom' || position === 'depth' || position === 'em_top'
    || position === 'em_bottom' || position === 'outlet') {
    return position;
  }
  switch (Number(position)) {
    case 0: return 'before';
    case 1: return 'after';
    case 2: return 'an_top';
    case 3: return 'an_bottom';
    case 4: return 'depth';
    case 5: return 'em_top';
    case 6: return 'em_bottom';
    case 7: return 'outlet';
    default: return undefined;
  }
}

function getWorldInfoPositionLabel(position) {
  return WORLD_INFO_POSITION_LABELS[position] || '未知位置';
}

function getWorldInfoEntryDisplayName(entry) {
  if (!entry || typeof entry !== 'object') return String(entry ?? '');
  const comment = String(entry.comment || '').trim();
  if (comment) return comment;
  if (Array.isArray(entry.key)) {
    const firstKey = entry.key.find((value) => String(value || '').trim());
    if (firstKey !== undefined) return String(firstKey).trim();
  }
  const keys = String(entry.keys || '').trim();
  if (keys) return keys.split(',')[0].trim();
  return String(entry.uid ?? '');
}

// 把 ST 引擎给出的激活条目按「注入前 / 注入后 / 其他位置」组装成文本块：
// 组装方式与酒馆一致（同一位置内按激活顺序 unshift，使低 order 条目在前），
// 排除名单在此处生效；before 进开头块、after 进结尾块，AN / 深度 / 示例 / 出口
// 等位置在档案分析提示词里没有对应槽位，统一进 <World_Info_Extra> 补充块——
// 它们仍是酒馆规则触发的世界书背景（用户世界书大量用 AN 位置放角色描述），
// 只跳过内容为空的条目。
function buildPositionedWorldInfoBlocks(result, excludedKeys) {
  const before = [];
  const after = [];
  const extra = [];
  const included = [];
  const excluded = [];
  const skipped = [];
  const activation = result?.worldInfoActivation;
  const entries = Array.isArray(activation?.entries) ? activation.entries : [];
  for (const entry of entries) {
    const content = String(entry?.content || '').trim();
    if (!content) {
      skipped.push(entry);
      continue;
    }
    if (isWorldInfoEntryExcluded(excludedKeys, entry)) {
      excluded.push(entry);
      continue;
    }
    const position = normalizeWorldInfoPosition(entry?.position);
    if (position === 'before') before.unshift(content);
    else if (position === 'after') after.unshift(content);
    else extra.unshift(content);
    included.push(entry);
  }
  return {
    before: before.length > 0 ? before.join('\n') : '',
    after: after.length > 0 ? after.join('\n') : '',
    extra: extra.length > 0 ? extra.join('\n') : '',
    included,
    excluded,
    skipped,
  };
}

const NO_WORLD_INFO = Object.freeze({
  mode: 'none',
  before: '',
  after: '',
  extra: '',
  counts: Object.freeze({ included: 0, excluded: 0, skipped: 0 }),
  names: Object.freeze({ included: [], excluded: [], skipped: [] }),
});

// 档案分析用的世界书解析：返回 { mode, before, after, counts }。
// mode = 'entries'（按条目过滤，排除生效）| 'strings'（酒馆原文整体注入）| 'none'。
// 日志用的条目标签：显示名优先，兜底 书名#uid。
function worldInfoEntryLabel(entry) {
  const displayName = String(entry?.displayName || '').trim();
  if (displayName) return displayName;
  return `${String(entry?.world || '').trim()}#${String(entry?.uid ?? '').trim()}`;
}

async function resolveWorldInfoForAnalysis() {
  const ctx = getContextSafe();
  if (!ctx || typeof ctx.getWorldInfoPrompt !== 'function') return NO_WORLD_INFO;
  const result = await getStWorldInfoActivation(ctx);
  if (!result) return NO_WORLD_INFO;
  const activation = result.worldInfoActivation;
  if (Array.isArray(activation?.entries)) {
    const excludedKeys = getWorldInfoExcludedKeys(getSettings(ctx));
    const blocks = buildPositionedWorldInfoBlocks(result, excludedKeys);
    return {
      mode: 'entries',
      before: blocks.before,
      after: blocks.after,
      extra: blocks.extra,
      counts: { included: blocks.included.length, excluded: blocks.excluded.length, skipped: blocks.skipped.length },
      names: {
        included: blocks.included.map(worldInfoEntryLabel),
        excluded: blocks.excluded.map(worldInfoEntryLabel),
        skipped: blocks.skipped.map(worldInfoEntryLabel),
      },
    };
  }
  // 宿主未提供条目级激活数据：原样注入酒馆拼好的文本（无法按条目排除）。
  return {
    mode: 'strings',
    before: String(result.worldInfoBefore || '').trim(),
    after: String(result.worldInfoAfter || '').trim(),
    extra: '',
    counts: { included: 0, excluded: 0, skipped: 0 },
    names: { included: [], excluded: [], skipped: [] },
  };
}

// 世界书视图：收集「当前激活的书」名单。
// 来源：本次激活结果（必然激活）+ 角色主世界书 + /getcharbook 兜底 +
// 聊天绑定书 + 人设书 + 全局书多选框（#world_info）。
async function getActiveWorldBookNames(ctx, result) {
  const names = new Set();
  const push = (value) => {
    const name = String(value || '').trim();
    if (name) names.add(name);
  };
  const activation = result?.worldInfoActivation;
  if (Array.isArray(activation?.entries)) {
    for (const entry of activation.entries) push(entry?.world);
  }
  const character = Array.isArray(ctx?.characters) && Number.isInteger(ctx?.characterId) ? ctx.characters[ctx.characterId] : null;
  push(character?.data?.extensions?.world);
  if (typeof globalThis.STscript === 'function') {
    try {
      const pipe = await globalThis.STscript('/getcharbook');
      push(pipe?.pipe ?? pipe);
    } catch (error) {
      console.warn(`[${MODULE_NAME}] /getcharbook failed`, error);
    }
  }
  push(ctx?.chatMetadata?.world_info);
  push(ctx?.powerUserSettings?.persona_description_lorebook);
  try {
    const select = document.getElementById('world_info');
    if (select?.selectedOptions) {
      for (const option of select.selectedOptions) push(option.textContent || option.label || option.value);
    }
  } catch {}
  return names;
}

async function loadWorldBookEntries(ctx, bookName) {
  const name = String(bookName || '').trim();
  if (!name || typeof ctx?.loadWorldInfo !== 'function') return [];
  try {
    const book = await ctx.loadWorldInfo(name);
    const entries = book?.entries;
    if (!entries || typeof entries !== 'object') return [];
    const list = Array.isArray(entries) ? entries : Object.values(entries);
    const loaded = [];
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      loaded.push({
        world: name,
        uid: entry.uid,
        displayName: getWorldInfoEntryDisplayName(entry),
        constant: entry.constant === true,
        disabled: entry.disable === true,
        position: normalizeWorldInfoPosition(entry.position),
        content: String(entry.content || '').trim(),
      });
    }
    return loaded;
  } catch (error) {
    console.warn(`[${MODULE_NAME}] loadWorldInfo "${name}" failed`, error);
    return [];
  }
}

function getWorldBookModeText(mode) {
  switch (mode) {
    case 'entries': return '激活引擎正常';
    case 'strings': return '酒馆规则生效';
    case 'none': return '世界书引擎不可用';
    default: return '未知状态';
  }
}

function refreshHomeWorldBookStatus() {
  const status = document.getElementById(HOME_WORLDBOOK_STATUS_ID);
  if (!status) return;
  try {
    const ctx = getContextSafe();
    const settings = ctx ? getSettings(ctx) : null;
    const excludedCount = settings && settings.worldInfo?.excluded
      ? Object.values(settings.worldInfo.excluded).reduce((sum, uids) => sum + (Array.isArray(uids) ? uids.length : 0), 0)
      : 0;
    const engineOk = Boolean(ctx && typeof ctx.getWorldInfoPrompt === 'function');
    if (!engineOk) {
      status.textContent = '引擎不可用';
      status.dataset.state = 'error';
    } else if (excludedCount > 0) {
      status.textContent = `已排除 ${excludedCount} 条`;
      status.dataset.state = 'ok';
    } else {
      status.textContent = '跟随酒馆规则';
      status.dataset.state = 'idle';
    }
  } catch (error) {
    status.textContent = '跟随酒馆规则';
    status.dataset.state = 'idle';
  }
}

function toggleWorldBookEntryExclusion(bookName, uid, excluded) {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  const bookKey = String(bookName || '').trim();
  const uidKey = String(uid ?? '').trim();
  if (!bookKey || !uidKey) return;
  const excludedMap = settings.worldInfo.excluded;
  const uids = new Set(Array.isArray(excludedMap[bookKey]) ? excludedMap[bookKey] : []);
  if (excluded) uids.add(uidKey);
  else uids.delete(uidKey);
  if (uids.size > 0) excludedMap[bookKey] = Array.from(uids);
  else delete excludedMap[bookKey];
  saveSettings(ctx);
  refreshHomeWorldBookStatus();
  renderWorldBookList();
}

function clearWorldBookExclusions() {
  const ctx = getContextSafe();
  if (!ctx) return;
  const settings = getSettings(ctx);
  settings.worldInfo.excluded = {};
  saveSettings(ctx);
  refreshHomeWorldBookStatus();
  renderWorldBookList();
}

function buildWorldBookBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `soullink-worldbook__badge ${className}`;
  badge.textContent = text;
  return badge;
}

// 渲染序号：排除勾选/刷新会触发多次并发 render，只允许最新一次写 DOM，
// 避免交错渲染导致列表重复。
let worldBookRenderSeq = 0;

// 每本书的搜索词：渲染会整体重建 DOM，搜索词单独保存，排除勾选/刷新后不丢。
const worldBookSearchQueries = new Map();

// 条目显示排序：常驻 → 本次触发 → 未触发（可触发）→ 禁用（根本不会被激活）。
// 与酒馆编辑器的 priority 排序（常驻→普通→禁用）一致，普通档内再按「本次触发」优先；
// 禁用条目即使标了常驻也排最后——酒馆扫描时 disable 检查先于 constant，禁用条目永远不会激活。
function getWorldBookEntryRank(entry, triggered) {
  if (entry.disabled) return 3;
  if (entry.constant) return 0;
  if (triggered) return 1;
  return 2;
}

// 在书区块内按条目名称过滤行：只隐藏 DOM，不重跑酒馆引擎，也不丢搜索框焦点。
function applyWorldBookSearch(section, query) {
  const q = String(query || '').trim().toLowerCase();
  const rows = section.querySelectorAll('.soullink-worldbook__entry');
  const count = section.querySelector('.soullink-worldbook__book-count');
  let matched = 0;
  for (const row of rows) {
    const hit = !q || String(row.dataset.search || '').includes(q);
    row.hidden = !hit;
    if (hit) matched += 1;
  }
  if (count && rows.length > 0) {
    count.textContent = q ? `${matched} / ${rows.length} 条` : `${rows.length} 条`;
  }
}

async function renderWorldBookList() {
  const seq = ++worldBookRenderSeq;
  const list = document.getElementById(WORLDBOOK_LIST_ID);
  if (!list) return;
  const status = document.getElementById(WORLDBOOK_STATUS_ID);
  const chatNode = document.getElementById(WORLDBOOK_CHAT_ID);
  const banner = document.getElementById(WORLDBOOK_BANNER_ID);
  const clearButton = document.getElementById(WORLDBOOK_CLEAR_ID);
  const ctx = getContextSafe();
  if (!ctx) {
    if (status) {
      status.textContent = '宿主上下文不可用';
      status.dataset.state = 'error';
    }
    list.textContent = '';
    return;
  }
  if (chatNode) chatNode.textContent = `当前聊天：${getCurrentChatLabel(ctx)}`;
  if (status) {
    status.textContent = '读取中…';
    status.dataset.state = 'busy';
  }
  const settings = getSettings(ctx);
  const result = await getStWorldInfoActivation(ctx);
  if (seq !== worldBookRenderSeq) return;
  const mode = !result ? 'none' : (Array.isArray(result?.worldInfoActivation?.entries) ? 'entries' : 'strings');
  const excludedKeys = getWorldInfoExcludedKeys(settings);
  const triggeredKeys = new Set();
  if (mode === 'entries') {
    for (const entry of result.worldInfoActivation.entries) {
      triggeredKeys.add(worldInfoEntryKey(entry?.world, entry?.uid));
    }
  }
  const bookNames = await getActiveWorldBookNames(ctx, result);
  if (seq !== worldBookRenderSeq) return;
  const excludedTotal = excludedKeys.size;
  if (status) {
    status.textContent = `${getWorldBookModeText(mode)} · ${bookNames.size} 本书 · ${excludedTotal} 条排除`;
    status.dataset.state = mode === 'none' ? 'error' : (excludedTotal > 0 ? 'ok' : 'idle');
  }
  if (clearButton) clearButton.hidden = excludedTotal === 0;
  if (banner) {
    if (mode === 'strings') {
      banner.hidden = false;
      banner.textContent = '当前宿主未提供条目级激活数据：世界书将按 SillyTavern 原文整体注入（无法按条目排除），下方列表仅供查看。';
    } else if (mode === 'none') {
      banner.hidden = false;
      banner.textContent = (typeof ctx.getWorldInfoPrompt === 'function')
        ? '世界书引擎调用失败（见后台日志）：本次档案分析不会注入世界书内容。'
        : '宿主未提供世界书引擎（getWorldInfoPrompt）：本次档案分析不会注入世界书内容。';
    } else {
      banner.hidden = true;
      banner.textContent = '';
    }
  }
  list.textContent = '';
  if (bookNames.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'soullink-worldbook__empty';
    empty.textContent = mode === 'none'
      ? '当前没有可读取的世界书。'
      : '当前聊天没有激活任何世界书（角色 / 全局 / 聊天均未绑定）。';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const bookName of Array.from(bookNames).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))) {
    const entries = await loadWorldBookEntries(ctx, bookName);
    if (seq !== worldBookRenderSeq) return;
    const section = document.createElement('div');
    section.className = 'soullink-worldbook__book';
    const head = document.createElement('div');
    head.className = 'soullink-worldbook__book-head';
    const title = document.createElement('span');
    title.className = 'soullink-worldbook__book-name';
    title.textContent = bookName;
    const count = document.createElement('span');
    count.className = 'soullink-worldbook__book-count';
    count.textContent = `${entries.length} 条`;
    head.append(title, count);
    section.appendChild(head);
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'soullink-worldbook__book-empty';
      empty.textContent = '（无法读取该书的条目）';
      section.appendChild(empty);
      fragment.appendChild(section);
      continue;
    }
    entries.sort((a, b) => {
      const rankA = getWorldBookEntryRank(a, triggeredKeys.has(worldInfoEntryKey(a.world, a.uid)));
      const rankB = getWorldBookEntryRank(b, triggeredKeys.has(worldInfoEntryKey(b.world, b.uid)));
      return rankA - rankB;
    });
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'soullink-worldbook__search';
    searchInput.placeholder = '搜索条目名称…';
    searchInput.value = worldBookSearchQueries.get(bookName) || '';
    searchInput.addEventListener('input', () => {
      const query = searchInput.value;
      if (query) worldBookSearchQueries.set(bookName, query);
      else worldBookSearchQueries.delete(bookName);
      applyWorldBookSearch(section, query);
    });
    section.appendChild(searchInput);
    for (const entry of entries) {
      const key = worldInfoEntryKey(entry.world, entry.uid);
      const excluded = excludedKeys.has(key);
      const triggered = triggeredKeys.has(key);
      const row = document.createElement('label');
      row.className = 'soullink-worldbook__entry';
      row.dataset.search = String(entry.displayName || `条目 ${entry.uid}`).toLowerCase();
      if (excluded) row.classList.add('is-excluded');
      if (triggered) row.classList.add('is-triggered');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = excluded;
      checkbox.disabled = mode !== 'entries';
      checkbox.title = mode === 'entries'
        ? '排除后，该条目即使被 SillyTavern 触发也不会注入档案分析提示词'
        : '当前宿主不支持按条目排除';
      checkbox.addEventListener('change', () => {
        toggleWorldBookEntryExclusion(entry.world, entry.uid, checkbox.checked);
      });
      const textWrap = document.createElement('span');
      textWrap.className = 'soullink-worldbook__entry-main';
      const name = document.createElement('span');
      name.className = 'soullink-worldbook__entry-name';
      name.textContent = entry.displayName || `条目 ${entry.uid}`;
      name.title = entry.content || entry.displayName || '';
      const badges = document.createElement('span');
      badges.className = 'soullink-worldbook__entry-badges';
      if (entry.constant) badges.appendChild(buildWorldBookBadge('常驻', 'is-constant'));
      if (entry.disabled) badges.appendChild(buildWorldBookBadge('禁用', 'is-disabled'));
      badges.appendChild(buildWorldBookBadge(getWorldInfoPositionLabel(entry.position), 'is-position'));
      if (triggered) badges.appendChild(buildWorldBookBadge('本次触发', 'is-triggered'));
      if (excluded) badges.appendChild(buildWorldBookBadge('已排除', 'is-excluded'));
      textWrap.append(name, badges);
      row.append(checkbox, textWrap);
      section.appendChild(row);
    }
    applyWorldBookSearch(section, worldBookSearchQueries.get(bookName) || '');
    fragment.appendChild(section);
  }
  // 清理已不在当前激活列表里的书的搜索词。
  for (const key of Array.from(worldBookSearchQueries.keys())) {
    if (!bookNames.has(key)) worldBookSearchQueries.delete(key);
  }
  list.appendChild(fragment);
}

function initWorldBookSection(panel) {
  if (!panel || panel.dataset.worldbookReady === 'true') return;
  document.getElementById(WORLDBOOK_REFRESH_ID)?.addEventListener('click', renderWorldBookList);
  document.getElementById(WORLDBOOK_CLEAR_ID)?.addEventListener('click', clearWorldBookExclusions);
  refreshHomeWorldBookStatus();
  panel.dataset.worldbookReady = 'true';
  logApp('info', '世界书系统已就绪');
}


function serializeArchiveForPrompt(archive) {
  const fields = {};
  for (const key of ARCHIVE_SCALAR_FIELDS) fields[key] = String(archive.fields[key] || '');
  const profile = { fields };
  for (const section of ARCHIVE_SECTIONS) {
    profile[section.key] = (Array.isArray(archive[section.key]) ? archive[section.key] : [])
      .map((item) => ({ id: String(item.id || ''), content: String(item.content || '') }));
  }
  return profile;
}

// 档案分析请求体（v0.8.4 起）按「提示词 → 剧情 → 世界书 → 输入」四段式组织：
// 1. system 档案系统提示词；
// 2. user 剧情段：引导消息 + <Recent_Messages> 块（最近几条消息，XML 包裹）；
// 3. user 世界书段：引导消息 + <World_Info_Before>/<World_Info_Extra>/<World_Info_After> 块（有则发）；
// 4. user 输入段：JSON（character / current_profile / turn_index，剧情与世界书已独立成节，不再重复携带）。
async function buildArchiveAnalysisMessages(name, archive, prompt) {
  const recentMessages = getRecentMessages(ARCHIVE_RECENT_MESSAGE_COUNT);
  const payload = {
    character: name,
    current_profile: serializeArchiveForPrompt(archive),
    turn_index: (getContextSafe()?.chat?.length) || 0,
  };
  // 世界书按酒馆规则的触发结果，注入在分析提示词的「合适位置」：
  // before 块放最前、after 块放最后（与酒馆 worldInfoBefore/After 的语义一致）。
  const worldInfo = await resolveWorldInfoForAnalysis();
  const worldBlocks = [];
  if (worldInfo.before) worldBlocks.push(`<World_Info_Before>\n${worldInfo.before}\n</World_Info_Before>`);
  if (worldInfo.extra) worldBlocks.push(`<World_Info_Extra>\n${worldInfo.extra}\n</World_Info_Extra>`);
  if (worldInfo.after) worldBlocks.push(`<World_Info_After>\n${worldInfo.after}\n</World_Info_After>`);
  const messages = [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        `以下是最新的剧情（最近 ${ARCHIVE_RECENT_MESSAGE_COUNT} 条消息），可能包含该角色不在场的段落。`,
        '请先判断该角色本轮是否在场、真实获知或亲历了什么，再据此更新人物档案',
        '（标量字段、性格、世界观、家庭背景、人际关系与记忆）；该角色不在场的内容只作背景，不得写入其档案。',
        '',
        `<Recent_Messages>\n${JSON.stringify(recentMessages, null, 2)}\n</Recent_Messages>`,
      ].join('\n'),
    },
    ...(worldBlocks.length > 0 ? [{
      role: 'user',
      content: [
        '以下是世界书注入内容，包含人物档案与世界背景信息：与 character 同名的条目是该角色本人的设定卡，',
        '是权威设定来源，可直接用于补全其档案；对所有人生效的普适世界设定（社会秩序、认主体系、超自然规则等）',
        '是该角色默认知晓的常识，应写入其世界观；其他角色的个人条目与私密信息仅作背景参考，',
        '只有该角色确实获知的内容才能写入其档案。',
        '',
        worldBlocks.join('\n\n'),
      ].join('\n'),
    }] : []),
    {
      role: 'user',
      content: `请依据约定输出 JSON，输入如下：\n\n${JSON.stringify(payload, null, 2)}`,
    },
  ];
  if (worldBlocks.length === 0) {
    logApp('warn', '世界书未注入内容', worldInfo.mode, worldInfo.counts, worldInfo.names);
  } else {
    logApp('info', '世界书注入', worldInfo.mode, worldInfo.counts, worldInfo.names);
  }
  return messages;
}

// TauriTavern 宿主代理的对话接口是 /api/backends/chat-completions/generate，
// 请求体与 SillyTavern 的 /chat-completions 不同：custom_include_headers 的值
// 需带引号（`Authorization: "Bearer xxx"`）。参数格式参考 st-chatu8 扩展。
function buildHostProxyChatConfig(apiBase, settings, body) {
  const apiKey = String(settings?.apiKey || '').trim();
  return {
    chat_completion_source: 'custom',
    custom_url: apiBase,
    custom_include_headers: apiKey ? `Authorization: "Bearer ${apiKey}"` : '',
    ...body,
  };
}

async function requestHostProxyChatCompletion(apiBase, settings, body, signal) {
  return fetchText('/api/backends/chat-completions/generate', {
    method: 'POST',
    headers: getHostProxyHeaders(),
    body: JSON.stringify(buildHostProxyChatConfig(apiBase, settings, body)),
    cache: 'no-cache',
    timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
    signal,
  });
}

function createCancelError() {
  const error = new Error('请求已取消');
  error.name = 'SoulLinkCancelError';
  return error;
}

async function chatCompletion(settings, messages, options = {}) {
  const apiBase = getApiBase(settings);
  if (!apiBase) throw new Error('请先在「API 连接」中配置 Base URL');
  const model = String(settings?.model || '').trim();
  if (!model) throw new Error('请先在「API 连接」中选择模型');
  const url = `${apiBase}/chat/completions`;
  const body = {
    model,
    messages,
    stream: false,
    temperature: Number.isFinite(options.temperature) ? options.temperature : 0.2,
  };
  const useHostProxy = isCrossOriginUrl(url);
  let response = null;
  let responseText = '';
  let transport = useHostProxy ? 'host-proxy' : 'direct';
  logApp('debug', '发送 AI 对话请求', `${model} · ${transport}`);
  try {
    if (useHostProxy) {
      let proxyError = null;
      try {
        ({ response, responseText } = await requestHostProxyChatCompletion(apiBase, settings, body, options.signal));
      } catch (error) {
        if (options.signal?.aborted) throw createCancelError();
        proxyError = error;
        console.warn(`[${MODULE_NAME}] host proxy chat completion failed, trying direct`, error);
      }
      const proxyLooksBroken = !response?.ok || !looksLikeJson(responseText);
      if (proxyError || proxyLooksBroken || shouldFallbackFromHostProxy(responseText, response?.status)) {
        transport = 'direct-after-proxy-fallback';
        ({ response, responseText } = await fetchText(url, {
          method: 'POST',
          headers: getAuthHeaders(settings),
          body: JSON.stringify(body),
          timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
          signal: options.signal,
        }));
      }
    } else {
      ({ response, responseText } = await fetchText(url, {
        method: 'POST',
        headers: getAuthHeaders(settings),
        body: JSON.stringify(body),
        timeoutMs: CHAT_COMPLETION_TIMEOUT_MS,
        signal: options.signal,
      }));
    }
  } catch (error) {
    if (options.signal?.aborted) throw createCancelError();
    throw new Error(`对话请求失败（${transport}）。请检查 API 配置。原始错误: ${String(error?.message || error)}`);
  }
  if (!response?.ok) {
    throw new Error(`对话请求失败 ${response?.status}（${transport}）: ${String(responseText || '').slice(0, 240)}`);
  }
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`对话响应不是 JSON（${transport}）: ${String(responseText || '').slice(0, 180)}`);
  }
  if (data && typeof data === 'object' && data.error) {
    const errorMessage = typeof data.error === 'string'
      ? data.error
      : (data.error.message || JSON.stringify(data.error));
    throw new Error(`上游 API 返回错误（${transport}）: ${String(errorMessage).slice(0, 240)}`);
  }
  if (data && typeof data === 'object' && data.response != null && data.choices == null) {
    try {
      const nested = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
      if (nested && typeof nested === 'object') data = nested;
    } catch {}
  }
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
  if (typeof content !== 'string' || !content.trim()) {
    const errorMessage = data?.error?.message ? `: ${data.error.message}` : '';
    throw new Error(`AI 未返回文本内容（${transport}）${errorMessage}`);
  }
  logApp('debug', 'AI 对话响应已接收', `${model} · ${transport}`);
  return content;
}

function parseAgentJson(text) {
  const source = String(text || '').trim();
  const fenced = source.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenced ? fenced[1].trim() : source;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {}
  }
  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw new Error(`AI 返回内容无法解析为 JSON：${String(error?.message || error)}`);
  }
}

function applyArchiveDiff(archive, diff) {
  const changes = [];
  if (!diff || typeof diff !== 'object' || Array.isArray(diff)) return changes;
  if (diff.fields && typeof diff.fields === 'object' && !Array.isArray(diff.fields)) {
    for (const key of ARCHIVE_SCALAR_FIELDS) {
      if (diff.fields[key] === undefined || diff.fields[key] === null) continue;
      const value = String(diff.fields[key]).trim();
      if (archive.fields[key] !== value) {
        archive.fields[key] = value;
        changes.push(`字段「${ARCHIVE_SCALAR_LABELS[key]}」→ ${value}`);
      }
    }
  }
  for (const section of ARCHIVE_SECTIONS) {
    const ops = diff[section.key];
    if (!ops || typeof ops !== 'object' || Array.isArray(ops)) continue;
    applySectionOps(archive, section, ops, changes);
  }
  return changes;
}

function applySectionOps(archive, section, ops, changes) {
  const items = Array.isArray(archive[section.key]) ? archive[section.key] : [];
  const removeIds = new Set((Array.isArray(ops.remove) ? ops.remove : []).map((id) => String(id)));
  const removed = items.filter((item) => !removeIds.has(String(item.id)));
  if (removed.length !== items.length) {
    changes.push(`「${section.label}」移除 ${items.length - removed.length} 条`);
  }

  const updateById = new Map();
  (Array.isArray(ops.update) ? ops.update : []).forEach((item) => {
    if (item && item.id !== undefined && item.id !== null) updateById.set(String(item.id), String(item.content ?? ''));
  });
  const next = removed.map((item) => {
    const content = updateById.get(String(item.id));
    if (content === undefined || content === item.content) return item;
    changes.push(`「${section.label}」更新 ${item.id}`);
    return { ...item, content };
  });

  const seenContents = new Set(next.map((item) => item.content));
  const usedIds = new Set(items.map((item) => String(item.id)));
  const additions = Array.isArray(ops.add) ? ops.add : [];
  for (const addition of additions) {
    const content = String(typeof addition === 'string' ? addition : addition?.content ?? '').trim();
    if (!content) continue;
    if (seenContents.has(content)) continue;
    let id = null;
    if (addition && typeof addition === 'object' && addition.id !== undefined && addition.id !== null) {
      const candidate = String(addition.id).trim();
      if (candidate && !usedIds.has(candidate)) id = candidate;
    }
    if (!id) id = nextSectionItemId(section, next);
    next.push({ id, content });
    usedIds.add(id);
    seenContents.add(content);
    changes.push(`「${section.label}」新增 ${content.length > 24 ? `${content.slice(0, 24)}…` : content}`);
  }

  archive[section.key] = next;
}

async function analyzeCharacter(name) {
  const ctx = getContextSafe();
  const roster = ctx ? getRoster(ctx) : null;
  const archive = roster?.[name];
  if (!ctx || !archive) return 'skipped';
  if (archiveAnalysisState[name]?.state === 'busy') return 'busy';
  const settings = getSettings(ctx);
  const prompt = getPromptSavedText('archiveSystem', ctx);
  if (!prompt) {
    globalThis.toastr?.error?.('未找到「档案系统」提示词', `[${MODULE_NAME}]`);
    return 'skipped';
  }
  const controller = new AbortController();
  archiveAnalysisState[name] = { state: 'busy', message: '分析中…', controller };
  renderArchiveCard(name);
  renderAnalyzeAllButton();
  logApp('info', '开始分析角色档案', name);
  try {
    const messages = await buildArchiveAnalysisMessages(name, archive, prompt);
    const content = await chatCompletion(settings, messages, { signal: controller.signal });
    const diff = parseAgentJson(content);
    const changes = applyArchiveDiff(archive, diff);
    archive.updatedAt = Date.now();
    saveSettingsImmediate(ctx);
    const summary = changes.length > 0 ? `更新 ${changes.length} 处` : '无变化';
    archiveAnalysisState[name] = { state: 'ok', message: summary };
    logApp('info', '角色档案分析完成', name, summary);
    globalThis.toastr?.success?.(`「${name}」${summary}`, `[${MODULE_NAME}]`);
    return 'ok';
  } catch (error) {
    const cancelled = controller.signal.aborted || error?.name === 'SoulLinkCancelError' || error?.name === 'AbortError';
    if (cancelled) {
      // 取消按钮点击时已把状态置为 cancelled，这里不再覆盖；
      // 若因其他原因中断（如宿主提前 abort），则补齐状态。
      if (archiveAnalysisState[name]?.state !== 'cancelled') {
        archiveAnalysisState[name] = { state: 'cancelled', message: '已取消' };
      }
      logApp('info', '角色档案分析已取消', name);
      return 'cancelled';
    }
    console.error(`[${MODULE_NAME}] analyzeCharacter failed`, error);
    const message = String(error?.message || error);
    archiveAnalysisState[name] = { state: 'error', message: '分析失败' };
    logApp('error', '角色档案分析失败', name, message);
    globalThis.toastr?.error?.(`「${name}」分析失败：${message.slice(0, 160)}`, `[${MODULE_NAME}]`);
    return 'error';
  } finally {
    renderArchiveCard(name);
    renderAnalyzeAllButton();
    refreshHomeStatuses();
  }
}

// ---------- 自动档案维护：Gate 预筛 + 并发分析 ----------
// 触发时机：宿主每轮生成结束（generationEnded）且确实产出了新的 AI 回复。
// Gate 输入刻意保持最小：只送「已注册角色名单 + 最近 4 条消息」，不送档案、世界书等
// 其他上下文（与「档案预筛」提示词的输入说明一致）；Gate 只负责缩小名单，不产出内容。
// 稳定性设计（参考 NPC Tracker 流程，但规避其已知缺陷）：
// - 末条签名去重：同一末条被宿主反复触发（自动续写/事件重放）只处理一次；
// - 运行锁：上一轮 Gate/分析还在飞时新事件直接跳过，杜绝并发 API 风暴；
// - 中断检查：生成被用户中止时跳过，不对半截回复发起分析；
// - 名单交集：Gate 返回的名字必须与已注册名单求交集，未知名字一律丢弃；
// - 失败即跳过本轮：Gate 调用失败不降级、不重试轰炸，本轮视为已处理。
const autoArchiveState = {
  running: false,
  lastSignature: '',
};

function buildAutoArchiveSignature(message) {
  if (!message) return '';
  return [
    message.is_user ? 'user' : 'assistant',
    String(message.name || ''),
    String(message.mes || ''),
  ].join('|');
}

// Gate 请求体：system 预筛提示词 + user 输入段（registered_characters + recent_messages）。
// 与「档案预筛」默认提示词的输入说明保持一致，recent_messages 严格取最近 4 条；
// 刻意不携带档案、世界书等任何其他上下文。
function buildAutoArchiveGateMessages(names, prompt) {
  const recentMessages = getRecentMessages(ARCHIVE_RECENT_MESSAGE_COUNT);
  const payload = {
    registered_characters: names,
    recent_messages: recentMessages,
  };
  return [
    { role: 'system', content: prompt },
    {
      role: 'user',
      content: [
        `以下是近期对话（最近 ${ARCHIVE_RECENT_MESSAGE_COUNT} 条消息），可能包含各角色不在场的段落。`,
        '请判断 registered_characters 中哪些角色的信息或记忆会发生变化，只输出约定 JSON。',
        '',
        `请依据约定输出 JSON，输入如下：\n\n${JSON.stringify(payload, null, 2)}`,
      ].join('\n'),
    },
  ];
}

// 解析 Gate 返回名单，并与已注册名单求交集：模型可能返回乱格式、含未注册名或根本没返回
// characters，这里统一归一化后只保留已注册名单中的角色名，杜绝未知名字混进后续分析。
function parseGateCharacterNames(parsed, registeredNames) {
  const allowed = new Set(registeredNames);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  if (!Array.isArray(parsed.characters)) return [];
  const out = [];
  const seen = new Set();
  for (const item of parsed.characters) {
    const name = String(item ?? '').trim();
    if (!name || seen.has(name) || !allowed.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

async function runAutoArchiveGate(ctx, settings, names, signature) {
  autoArchiveState.running = true;
  // 先标记签名再跑：同一末条被宿主反复触发时直接走签名去重，不再重跑 Gate。
  autoArchiveState.lastSignature = signature;
  try {
    const prompt = getPromptSavedText('archivePreScreen', ctx);
    if (!prompt) {
      logApp('warn', '自动档案维护跳过：未找到「档案预筛」提示词');
      return;
    }
    const messages = buildAutoArchiveGateMessages(names, prompt);
    logApp('info', '自动档案维护：预筛开始', `${names.length} 个已注册角色`);
    const content = await chatCompletion(settings, messages);
    const parsed = parseAgentJson(content);
    const selected = parseGateCharacterNames(parsed, names);
    logApp('info', '自动档案维护：预筛完成', `入选 ${selected.length}/${names.length} 个角色`, selected);
    if (selected.length === 0) {
      globalThis.toastr?.info?.('预筛完成：本轮无角色需要更新档案', `[${MODULE_NAME}]`);
      return;
    }
    globalThis.toastr?.info?.(`预筛完成：入选 ${selected.length}/${names.length} 个角色，开始更新档案`, `[${MODULE_NAME}]`);
    // 复用现有逐角色档案分析（含世界书注入与增量更新），并发执行。
    const results = await Promise.allSettled(selected.map((name) => analyzeCharacter(name)));
    const counts = { ok: 0, error: 0, cancelled: 0, skipped: 0, busy: 0 };
    for (const result of results) {
      const outcome = result.status === 'fulfilled' ? String(result.value || 'ok') : 'error';
      counts[outcome] = (counts[outcome] || 0) + 1;
    }
    const parts = [];
    if (counts.ok > 0) parts.push(`${counts.ok} 成功`);
    if (counts.error > 0) parts.push(`${counts.error} 失败`);
    if (counts.cancelled > 0) parts.push(`${counts.cancelled} 取消`);
    if (counts.skipped > 0) parts.push(`${counts.skipped} 跳过`);
    if (counts.busy > 0) parts.push(`${counts.busy} 进行中`);
    logApp('info', '自动档案维护：分析结束', parts.join('，') || '无角色可分析');
    if (counts.error > 0) {
      globalThis.toastr?.warning?.(`自动档案维护完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
    } else if (counts.ok > 0) {
      globalThis.toastr?.success?.(`自动档案维护完成：${parts.join('，')}`, `[${MODULE_NAME}]`);
    }
  } catch (error) {
    const message = String(error?.message || error);
    logApp('error', '自动档案维护失败', message);
    globalThis.toastr?.error?.(`自动档案维护失败：${message.slice(0, 160)}`, `[${MODULE_NAME}]`);
  } finally {
    autoArchiveState.running = false;
  }
}

async function onAutoArchiveGenerationEnded() {
  const ctx = getContextSafe();
  if (!ctx) return;
  let settings;
  try {
    settings = getSettings(ctx);
  } catch (error) {
    console.warn(`[${MODULE_NAME}] 自动档案维护：读取设置失败`, error);
    return;
  }
  if (!settings.autoArchiveEnabled) return;
  // 用户中断生成：跳过，避免对半截回复发起分析。
  if (ctx?.streamingProcessor?.abortController?.signal?.aborted) {
    logApp('info', '自动档案维护跳过：生成被中断');
    return;
  }
  const chat = Array.isArray(ctx.chat) ? ctx.chat : [];
  const lastMessage = chat[chat.length - 1];
  // 末条不是 AI 回复（空生成/失败/系统消息）：本轮没有可分析的新剧情。
  if (!lastMessage || lastMessage.is_user || lastMessage.is_system) {
    logApp('debug', '自动档案维护跳过：末条不是 AI 回复');
    return;
  }
  const signature = buildAutoArchiveSignature(lastMessage);
  if (autoArchiveState.lastSignature === signature) {
    logApp('debug', '自动档案维护跳过：本轮已处理');
    return;
  }
  if (autoArchiveState.running) {
    logApp('debug', '自动档案维护跳过：上一轮仍在运行');
    return;
  }
  const roster = getRoster(ctx);
  const names = Object.keys(roster || {});
  if (names.length === 0) {
    logApp('debug', '自动档案维护跳过：无已注册角色');
    return;
  }
  if (!getApiBase(settings) || !String(settings.model || '').trim()) {
    logApp('warn', '自动档案维护跳过：API 未配置');
    globalThis.toastr?.warning?.('自动档案维护已开启，但 API 尚未配置（Base URL / 模型）', `[${MODULE_NAME}]`);
    return;
  }
  await runAutoArchiveGate(ctx, settings, names, signature);
}

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
    onHostEvent(ctx, 'chatChanged', refreshChatBoundViews, '__soullink_chat_changed_handler__');
    onHostEvent(ctx, 'groupSelected', refreshChatBoundViews, '__soullink_group_selected_handler__');
    onHostEvent(ctx, 'generationEnded', onAutoArchiveGenerationEnded, AUTO_ARCHIVE_END_HANDLER_KEY);
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



