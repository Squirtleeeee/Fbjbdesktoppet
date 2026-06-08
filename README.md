# 菲比桌宠 — Claude Code 工作状态监视器

菲比（Phoebe）桌宠，实时监视 Claude Code 工作状态。基于 Electron + Canvas 2D 构建。

<img src="assets/sprites/idle/PhoebeX_038.png" width="128" alt="菲比">

## 功能

| 功能 | 说明 |
|------|------|
| 🐾 **状态监视** | 5 种工作状态实时切换：待机 / 思考 / 工作中 / 完成 / 等待授权 |
| 🎬 **动态动画** | Canvas 2D 帧动画，乒乓呼吸、循环工作、单次庆祝 |
| 📊 **Token 统计** | 当日累计（input / output / cache），进度条 + 缓存命中率 |
| 📋 **工作流面板** | 工作中状态侧边显示 TodoWrite 步骤 + 当前进度 |
| 💬 **气泡文字** | 中文 + 菲比啾比口癖自然融入，每状态随机短语 |
| 📌 **置顶/拖拽** | 可拖拽到任意位置，右键切换置顶 |
| 🔍 **缩放** | 0.5x / 1x / 2x / 3x |
| 💾 **位置记忆** | 关闭重启恢复上次位置 |

## 5 种状态

| 状态 | 触发条件 | 动画 | 帧数 |
|------|----------|------|------|
| 😴 **待机 Idle** | 无任务时 | 乒乓呼吸 | 6 |
| 🤔 **思考 Thinking** | Claude 调用 Think 工具 | 循环播放 | 4 |
| 🔧 **工作 Working** | 执行 Write/Edit/Bash 等 | 循环播放 + 工作流面板 | 4 |
| ✅ **完成 Done** | Stop hook 触发 | 单次播放 3s 后回待机 | 3 |
| ⏳ **等待授权** | AskUserQuestion 触发 | 循环播放 | 5 |

## 安装

```bash
cd desktoppet
npm install
# Electron 二进制需从 GitHub 下载（~170MB），国内建议配置代理
```

## 运行

```bash
# 构建 + 启动
npx vite build && ./node_modules/.bin/electron .

# 或一步到位
npm start
```

**重要：** 运行前确保环境变量 `ELECTRON_RUN_AS_NODE` 未设置，否则 Electron 会降级为纯 Node.js。

```bash
unset ELECTRON_RUN_AS_NODE
```

## 连接 Claude Code

### 1. 先启动桌宠

```bash
cd desktoppet
unset ELECTRON_RUN_AS_NODE
npx vite build && ./node_modules/.bin/electron .
```

启动后监听 `http://127.0.0.1:9527`。

### 2. 配置 Hook

在项目 `.claude/settings.json` 或全局 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "command": "node",
        "args": ["e:\\Poject claude code\\desktoppet\\hooks\\claude-code-hook.cjs", "post_tool"]
      }
    ],
    "Stop": [
      {
        "command": "node",
        "args": ["e:\\Poject claude code\\desktoppet\\hooks\\claude-code-hook.cjs", "stop"]
      }
    ],
    "PreToolUse": [
      {
        "command": "node",
        "args": ["e:\\Poject claude code\\desktoppet\\hooks\\claude-code-hook.cjs", "pre_tool"]
      }
    ]
  }
}
```

> 路径替换为你的实际项目路径。Linux/macOS 去掉 `e:\\` 前缀，用 `/` 分隔。

### 3. 使用

开始和 Claude Code 对话，桌宠会自动切换状态。

## 快捷键

| 操作 | 方式 |
|------|------|
| 置顶切换 | 右键 → 置顶/取消置顶 |
| 缩放 | 右键 → 选择倍率 |
| 拖拽 | 拖动宠物到任意位置 |
| 退出 | 右键 → 退出 |

## 项目结构

```
desktoppet/
├── electron/
│   ├── main.ts              # Electron 入口，透明浮窗 + 右键菜单
│   ├── preload.ts            # IPC 桥接（contextBridge）
│   ├── ws-server.ts          # HTTP + WebSocket 双模服务端
│   └── window-manager.ts     # 窗口位置/置顶/缩放管理
├── src/
│   ├── index.html            # 渲染进程 HTML
│   ├── main.ts               # 渲染进程入口
│   ├── engine/
│   │   ├── state-machine.ts  # 5 状态机 + done→idle 自动回落
│   │   ├── sprite-manager.ts # PNG 序列帧预加载
│   │   ├── animator.ts       # 帧动画（loop/pingpong/once）
│   │   └── canvas-renderer.ts# Canvas 2D requestAnimationFrame 渲染
│   ├── pet/
│   │   └── pet.ts            # Pet 主控（组装引擎+状态+UI）
│   ├── ui/
│   │   ├── speech-bubble.ts  # 气泡文字（DOM overlay）
│   │   ├── token-bar.ts      # Token 进度条（分段着色）
│   │   └── workflow-panel.ts # 工作流步骤面板
│   ├── data/
│   │   ├── state-receiver.ts # WS 事件 → 状态/Token/工作流回调
│   │   └── token-tracker.ts  # 当日 Token 累计 + localStorage 持久化
│   └── utils/
│       └── speech.ts         # 口癖系统（菲比啾比~）
├── hooks/
│   └── claude-code-hook.cjs  # Claude Code Hook 上报脚本
├── assets/
│   └── sprites/              # 22 张精灵帧（5 状态）
│       ├── idle/             # 6 帧
│       ├── thinking/         # 4 帧
│       ├── working/          # 4 帧
│       ├── done/             # 3 帧
│       └── waiting_auth/     # 5 帧
└── package.json
```

## 架构

```
Claude Code (Hook)
  │  PostToolUse / Stop / PreToolUse
  │  stdin → JSON
  ▼
claude-code-hook.cjs
  │  HTTP POST
  ▼
Electron 主进程 (ws-server.ts)
  │  127.0.0.1:9527
  │  IPC → webContents.send
  ▼
渲染进程
  │  StateMachine → Animator → CanvasRenderer
  │  TokenBar / WorkflowPanel / SpeechBubble
  ▼
桌宠窗口
```

## 素材来源

- 角色：菲比（Phoebe），出自《鸣潮》
- 原作者：Binci (https://arca.live/u/@Binci)
- 高清修复&描改：藍沢夕凪
- 仅供学习交流，严禁商业用途

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Electron 28 |
| 语言 | TypeScript |
| 渲染 | Canvas 2D |
| 动画 | requestAnimationFrame + 帧序列 |
| 通信 | HTTP Server（主进程）← hook 脚本 |
| 构建 | Vite + vite-plugin-electron |
| 持久化 | electron-store（位置）+ localStorage（Token） |

## License

MIT
