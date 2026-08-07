// SoulLink 构建脚本：把 js/ 下的源码按依赖顺序拼接成单个 index.js。
//
// 为什么需要它：TauriTavern 的 manifest 只接受单个 JS 文件（"js" 必须是字符串或
// 单元素数组），不支持多文件数组。因此源码拆在 js/ 下便于维护，发布时用本脚本
// 拼回一个 index.js 供宿主加载。
//
// 用法：node build.js
// 依赖：仅 Node 内置模块，无第三方依赖。
const fs = require('fs');
const path = require('path');

// 拼接顺序必须与依赖关系一致：常量 → 工具 → 宿主 → UI 外壳 → 各视图 → 核心管线 → 入口。
// 每个文件都是普通脚本（非 ES module），顶层 const/function 进入全局作用域，
// 顺序保证「被调用时已定义」即可（实际所有调用都发生在 bootstrap 里，顺序很宽松）。
const FILES = [
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
console.log(`[build] 已生成 index.js（${FILES.length} 个文件，${output.split('\n').length} 行）`);
