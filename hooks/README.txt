菲比桌宠 Hook 配置说明
======================

把 <HOOKS路径> 替换为本 hooks 文件夹的绝对路径，例如：
D:\菲比桌宠\hooks

使用前请先启动桌宠（菲比桌宠.exe），桌宠会监听 127.0.0.1:9527。

Claude Code
-----------
1. 打开或创建 用户目录/.claude/settings.json
2. 参考 claude-settings.example.json，把 hooks 配置合并进去
3. 将 <HOOKS路径> 改为本文件夹路径

Cursor
------
方式 A — 用户级（推荐，所有项目生效）：
1. 复制 cursor-hook.cjs 到 %USERPROFILE%\.cursor\hooks\
2. 参考 cursor-hooks.example.json，在 %USERPROFILE%\.cursor\hooks.json 中注册
   （路径改为 node "%USERPROFILE%\.cursor\hooks\cursor-hook.cjs" <event>）

方式 B — 项目级：
1. 把 cursor-hook.cjs 复制到目标项目的 .cursor/hooks/
2. 在目标项目根目录创建 .cursor/hooks.json 并注册

注意：Cursor hooks 不含 Token 统计，Token 仅 Claude Code hook 上报。
