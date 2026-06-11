# 菲比桌宠 — Claude Code / Cursor 工作状态监视器

基于 Electron + Canvas 2D 的桌面宠物，实时监视 Claude Code / Cursor Agent 工作状态。

角色形象：**菲比**（《鸣潮》菲比团子形态，白色大圆帽 + 蓝丝带 + 金发紫瞳），自称「菲比」，口癖「菲比啾比~」。全部帧由 AI 生成。

## 功能

| 功能 | 说明 |
|------|------|
| 🐾 **5 状态监视** | 待机 / 思考 / 工作 / 完成 / 等待授权 |
| 🎬 **帧动画** | idle 8 帧原生序列；其余状态各 4 关键帧（无插值，避免彩色叠影） |
| 📊 **Token 统计** | 独立弹窗，多时间段（上次对话 / 今日 / 项目 / 近七天 / 总计） |
| 📋 **工作流面板** | 左键菜单切换，显示 TodoWrite 步骤进度 |
| 🖱 **交互** | 左键拖拽、右键菜单、滚轮缩放 |
| 📌 **置顶** | 默认置顶，可切换 |
| 💬 **气泡** | 状态短语 + 漫画气泡（菲比自称 + 菲比啾比口癖） |
| 💾 **记忆** | 位置 / 大小持久化 |

## 5 种状态

| 状态 | 触发条件 | 动作 |
|------|----------|------|
| 😴 待机 Idle | 无任务 / 45s 超时回落 | 站立呼吸、眨眼 |
| 🤔 思考 Thinking | Think 工具 | 托腮思考 |
| 🔧 工作 Working | Write / Edit / Bash 等 | 坐地敲笔记本键盘 |
| ✅ 完成 Done | Stop hook | 跳跃撒花、比耶 |
| ⏳ 等待授权 | AskUserQuestion | 恳求脸、挥手求关注 |

## 运行

```powershell
# PowerShell（推荐）
.\start.ps1

# 或手动
npm run build
.\node_modules\electron\dist\electron.exe .
```

桌宠监听 `http://127.0.0.1:9527`，启动后保持运行即可接收 Hook 事件。

## 连接 Claude Code

在 `.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PostToolUse": [
      { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "post_tool"] }
    ],
    "Stop": [
      { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "stop"] }
    ],
    "PreToolUse": [
      { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "pre_tool"] }
    ],
    "UserPromptSubmit": [
      { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "user_prompt"] }
    ],
    "SessionStart": [
      { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "session_start"] }
    ]
  }
}
```

## 连接 Cursor

本仓库自带 `.cursor/hooks.json` + `.cursor/hooks/pet-hook.cjs`（项目级 Cursor hooks），
在 Cursor 中打开本项目即自动生效（提交 / 提问 / 工具调用 / 完成都会驱动桌宠）。

要在**其他项目**中使用，把这两个文件复制到目标项目，或安装为用户级 hooks：

1. 复制 `pet-hook.cjs` 到 `~/.cursor/hooks/pet-hook.cjs`
2. 在 `~/.cursor/hooks.json` 中注册（command 路径改为 `node hooks/pet-hook.cjs <event>`）

> Cursor hooks 目前只同步状态与工作流，不含 Token 用量；Token 统计来自 Claude Code hook。

桌宠通过本地 HTTP（`127.0.0.1:9527`）接收事件，协议与编辑器无关。

## 精灵素材

原图放在 `art/raw-phoebe/`（绿幕 PNG），处理后输出到 `assets/sprites/`：

```powershell
npm run sprites:process   # 绿幕抠图 + 居中裁剪
```

- **idle**：8 张原生 AI 帧（`phoebe-idle-0` … `phoebe-idle-7`）
- **其余状态**：各 4 关键帧（`phoebe-{state}-0` … `3`）
- 不使用像素插值扩展（`tools/expand-sprite-frames.cjs` 已弃用，插值帧会在工作状态产生彩色频闪）

动画渲染关闭图像平滑、不做帧间 crossfade，idle 仅有约 1px 呼吸浮动。

## 项目结构

```
desktoppet/
├── electron/
│   ├── main.ts              # 主进程（窗口 / 托盘 / 拖拽 / 菜单）
│   ├── preload.ts           # IPC 桥接
│   ├── ws-server.ts         # HTTP 服务端（接收 hook）
│   └── window-manager.ts    # 窗口管理 + 持久化
├── src/
│   ├── index.html           # 主窗口
│   ├── main.ts              # 渲染进程入口
│   ├── token-popup.html     # Token 统计弹窗
│   ├── engine/
│   │   ├── state-machine.ts # 5 状态机
│   │   ├── sprite-manager.ts
│   │   ├── animator.ts
│   │   └── canvas-renderer.ts
│   ├── pet/pet.ts
│   ├── ui/
│   │   ├── speech-bubble.ts
│   │   └── workflow-panel.ts
│   ├── data/
│   │   ├── state-receiver.ts
│   │   └── token-tracker.ts
│   └── utils/speech.ts      # 菲比短语池
├── hooks/claude-code-hook.cjs
├── .cursor/hooks.json + hooks/pet-hook.cjs
├── tools/process-sprites.cjs
├── assets/sprites/          # 打包用精灵帧
├── art/raw-phoebe/          # AI 原图（绿幕）
└── start.ps1
```

## 快捷键

| 操作 | 方式 |
|------|------|
| 拖拽移动 | 左键按住菲比拖拽 |
| 右键菜单 | 右键菲比 |
| 缩放 | 滚轮（0.3x ~ 3x） |
| 工作流面板 | 右键菜单 → 工作流 |
| 置顶切换 | 右键菜单 |
| 重置位置 | 托盘右键 → 重置位置 |

## 技术栈

Electron 28 · TypeScript · Canvas 2D · Vite

## License

MIT
