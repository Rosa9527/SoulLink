@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 后重试。
    pause
    exit /b 1
)

echo 正在构建 SoulLink（读取 prompts/*.txt 与 js/ 源码，生成 index.js）...
echo.
node build.js
if errorlevel 1 (
    echo.
    echo [错误] 构建失败，请检查上方输出。
) else (
    echo.
    echo [成功] 构建完成！重启酒馆即可生效。
)
echo.
pause