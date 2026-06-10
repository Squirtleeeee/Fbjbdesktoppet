# 桌宠 — Claude Code 工作状态监视器

基于 Electron + Canvas 2D 的桌面宠物，实时监视 Claude Code 工作状态。

## 功能

| 功能 | 说明 |
|------|------|
| 🐾 **5 状态监视** | 待机 / 思考 / 工作 / 完成 / 等待授权 |
| 🎬 **动态动画** | Shimeji 帧序列（Undertale Annoying Dog） |
| 📊 **Token 统计** | 独立弹窗，多时间段（上次对话/今日/项目/近七天/总计） |
| 📋 **工作流面板** | 右键显示 TodoWrite 步骤进度 |
| 🖱 **交互** | 左键拖拽、右键菜单、滚轮缩放 |
| 📌 **置顶** | 默认置顶，可切换 |
| 💬 **气泡** | 状态短语 + 漫画气泡 |
| 💾 **记忆** | 位置/大小持久化 |

## 5 种状态

| 状态 | 触发条件 | 动作 |
|------|----------|------|
| 😴 待机 Idle | 无任务 | 站立呼吸 |
| 🤔 思考 Thinking | Think 工具 | 坐下思考 |
| 🔧 工作 Working | Write/Edit/Bash 等 | 行走移动 |
| ✅ 完成 Done | Stop hook | 跳跃庆祝 |
| ⏳ 等待授权 | AskUserQuestion | 拖拽互动 |

## 运行

```powershell
# PowerShell
.\start.ps1

# 或手动
npx vite build
.\node_modules\electron\dist\electron.exe .
```

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
    ]
  }
}
```

## 项目结构

```
desktoppet/
├── electron/
│   ├── main.ts              # 主进程（窗口/托盘/拖拽/菜单）
│   ├── preload.ts            # IPC 桥接
│   ├── ws-server.ts          # HTTP/WS 服务端（接收 hook）
│   └── window-manager.ts     # 窗口管理 + 持久化
├── src/
│   ├── index.html            # 主窗口
│   ├── main.ts               # 渲染进程入口
│   ├── token-popup.html      # Token 统计弹窗
│   ├── engine/
│   │   ├── state-machine.ts  # 5 状态机
│   │   ├── sprite-manager.ts # 精灵帧加载
│   │   ├── animator.ts       # 帧动画
│   │   └── canvas-renderer.ts# Canvas 2D 渲染 + 像素 hit test
│   ├── pet/
│   │   └── pet.ts            # Pet 主控
│   ├── ui/
│   │   ├── speech-bubble.ts  # 漫画气泡
│   │   └── workflow-panel.ts # 工作流面板
│   ├── data/
│   │   ├── state-receiver.ts # WS 事件接收
│   │   └── token-tracker.ts  # 多时间段 Token 统计
│   └── utils/
│       └── speech.ts         # 短语池
├── hooks/
│   └── claude-code-hook.cjs  # Claude Code Hook 脚本
├── assets/
│   └── sprites/              # 小狗 Shimeji 帧（5 状态）
└── start.ps1                 # 启动脚本
```

## 快捷键

| 操作 | 方式 |
|------|------|
| 拖拽移动 | 左键按住小狗拖拽 |
| 右键菜单 | 右键小狗 |
| 缩放 | 滚轮（0.3x ~ 3x） |
| 置顶切换 | 右键菜单 |
| 重置位置 | 托盘右键 → 重置位置 |

## 技术栈

Electron 28 · TypeScript · Canvas 2D · Vite

## License

MIT
