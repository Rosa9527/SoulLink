// SoulLink 构建脚本：把 js/ 下的源码按依赖顺序拼接成单个 index.js。
//
// 为什么需要它：TauriTavern 的 manifest 只接受单个 JS 文件（"js" 必须是字符串或
// 单元素数组），不支持多文件数组。因此源码拆在 js/ 下便于维护，发布时用本脚本
// 拼回一个 index.js 供宿主加载。
//
// 默认提示词外挂在 prompts/ 目录（每个子系统一个 .txt 文件），构建时读取并生成
// js/prompts.generated.js，再随源码拼入 index.js。修改默认提示词只需编辑
// prompts/*.txt，然后运行 node build.js。
//
// 每次构建还会把历史默认累积快照到 js/prompts.previous.generated.js：
// 用户保存的文本若命中任一历史默认（未自定义），getSettings 会自动升级到
// 当前 prompts/*.txt 内容——本地迭代改提示词无需再改迁移代码，也不用重启间隔限制。
//
// 用法：
//   node build.js          一次性构建
//   node build.js --watch  监听 prompts/ 与 js/ 的变更，自动重建（Ctrl+C 退出）
// 依赖：仅 Node 内置模块，无第三方依赖。
const fs = require('fs');
const path = require('path');

// 默认提示词外挂文件：DEFAULT_PROMPTS 的 key → prompts/ 下的文件名。
const PROMPT_FILES = Object.freeze({
  archiveSystem: 'archiveSystem.txt',
  archivePreScreen: 'archivePreScreen.txt',
  roleplaySystem: 'roleplaySystem.txt',
  roleplayPreScreen: 'roleplayPreScreen.txt',
  archiveRefine: 'archiveRefine.txt',
});

// 拼接顺序必须与依赖关系一致：常量 → 工具 → 宿主 → UI 外壳 → 各视图 → 核心管线 → 入口。
// 每个文件都是普通脚本（非 ES module），顶层 const/function 进入全局作用域，
// 顺序保证「被调用时已定义」即可（实际所有调用都发生在 bootstrap 里，顺序很宽松）。
const FILES = [
  'js/prompts.generated.js',
  'js/prompts.previous.generated.js',
  'js/constants.js',
  'js/utils.js',
  'js/host.js',
  'js/ui-shell.js',
  'js/views-api.js',
  'js/views-filters.js',
  'js/views-log.js',
  'js/views-presets.js',
  'js/views-register.js',
  'js/views-archive.js',
  'js/views-home.js',
  'js/message-filters.js',
  'js/worldbook.js',
  'js/archive-analysis.js',
  'js/main.js',
];

const root = __dirname;

// 累积历史默认提示词快照：读取旧的 js/prompts.generated.js（本次构建覆盖前）与
// 已存在的 js/prompts.previous.generated.js（历史列表），合并去重后写回。
// 供 getSettings 迁移：保存文本命中任一历史默认（未自定义）→ 自动升级到新默认。
function generatePreviousPromptsModule() {
  const oldPath = path.join(root, 'js', 'prompts.generated.js');
  const prevPath = path.join(root, 'js', 'prompts.previous.generated.js');
  const vm = require('vm');

  // 历史列表：key -> [text, ...]（兼容旧单值格式）
  const history = {};
  if (fs.existsSync(prevPath)) {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(prevPath, 'utf8') + '\n;globalThis.__soullink_prev_history = PREVIOUS_DEFAULT_PROMPTS;', sandbox, { filename: prevPath });
    for (const [key, value] of Object.entries(sandbox.__soullink_prev_history || {})) {
      history[key] = Array.isArray(value) ? value.slice() : [value];
    }
  }
  // 把本次覆盖前的默认并入历史（去重）
  if (fs.existsSync(oldPath)) {
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(oldPath, 'utf8') + '\n;globalThis.__soullink_old_defaults = DEFAULT_PROMPTS;', sandbox, { filename: oldPath });
    for (const [key, value] of Object.entries(sandbox.__soullink_old_defaults || {})) {
      if (typeof value !== 'string') continue;
      if (!history[key]) history[key] = [];
      if (!history[key].includes(value)) history[key].push(value);
    }
  }
  const entries = Object.entries(history).map(([key, list]) =>
    `  ${key}: [\n${list.map((t) => `    ${JSON.stringify(t)}`).join(',\n')}\n  ]`
  );
  const content = [
    '// ===== 自动生成：历史默认提示词（由 build.js 每次构建时累积快照，请勿手改） =====',
    '// 用途：getSettings 迁移——保存文本命中任一历史默认（未自定义）时，自动升级到当前 prompts/*.txt 内容。',
    'const PREVIOUS_DEFAULT_PROMPTS = Object.freeze({',
    entries.join(',\n'),
    '});',
    '',
  ].join('\n');
  fs.writeFileSync(prevPath, content, 'utf8');
  return prevPath;
}

// 读取 prompts/ 下的默认提示词，生成 js/prompts.generated.js（DEFAULT_PROMPTS 定义）。
function generatePromptsModule() {
  const entries = Object.entries(PROMPT_FILES).map(([key, filename]) => {
    const full = path.join(root, 'prompts', filename);
    if (!fs.existsSync(full)) {
      console.error(`[build] 缺少默认提示词文件: ${full}`);
      process.exit(1);
    }
    const text = fs.readFileSync(full, 'utf8');
    return `  ${key}: ${JSON.stringify(text)}`;
  });
  const content = [
    '// ===== 自动生成：默认提示词（由 build.js 从 prompts/*.txt 生成，请勿手改） =====',
    'const DEFAULT_PROMPTS = Object.freeze({',
    entries.join(',\n'),
    '});',
    '',
  ].join('\n');
  const outPath = path.join(root, 'js', 'prompts.generated.js');
  fs.writeFileSync(outPath, content, 'utf8');
  return outPath;
}

function buildOnce() {
  const previousPath = generatePreviousPromptsModule();
  const generatedPath = generatePromptsModule();
  const parts = FILES.map((file) => {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) {
      console.error(`[build] 缺少文件: ${file}`);
      process.exit(1);
    }
    const content = fs.readFileSync(full, 'utf8');
    return `// ===== ${file} =====\n${content}`;
  });

  const output = parts.join('\n\n') + '\n';
  const outPath = path.join(root, 'index.js');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`[build] 已生成 ${path.relative(root, generatedPath)}、${path.relative(root, previousPath)} 与 index.js（${FILES.length} 个文件，${output.split('\n').length} 行）`);
}

const watchMode = process.argv.includes('--watch');
if (watchMode) {
  // 监听 prompts/ 与 js/：改默认提示词或源码后自动重建，无需手动跑 build。
  // 构建产物的写入会触发自身目录事件，按文件名过滤避免回环。
  const ignored = new Set(['prompts.generated.js', 'prompts.previous.generated.js', 'index.js']);
  const rebuild = () => {
    try {
      buildOnce();
    } catch (error) {
      console.error('[build] 重建失败', error);
    }
  };
  let timer = null;
  for (const dir of ['prompts', 'js']) {
    fs.watch(path.join(root, dir), { persistent: true }, (event, filename) => {
      if (filename && ignored.has(filename)) return;
      clearTimeout(timer);
      timer = setTimeout(rebuild, 200);
    });
  }
  console.log('[build] watch 模式：监听 prompts/ 与 js/，文件变更自动重建（Ctrl+C 退出）');
} else {
  buildOnce();
}