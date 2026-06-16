# 菲比桌宠

Claude Code / Cursor 工作状态桌面宠物。角色 **菲比**，口癖「菲比啾比~」。

## 下载使用（推荐）

1. 打开 [Releases](https://github.com/Squirtleeeee/Fbjbdesktoppet/releases) 下载 **`菲比桌宠-win.zip`**
2. 解压到任意目录
3. 双击 **`启动菲比.bat`** 或 **`菲比桌宠.exe`**
4. 按解压目录内 **`hooks/README.txt`** 配置 Claude Code / Cursor Hook

桌宠启动后监听 `http://127.0.0.1:9527`，需保持运行才能接收 Agent 状态。

### 压缩包内容

| 文件 | 说明 |
|------|------|
| `菲比桌宠.exe` | 绿色便携版，免安装 |
| `启动菲比.bat` | 一键启动 |
| `使用说明.txt` | 快速上手 |
| `hooks/` | Hook 脚本与配置示例 |

### 常用操作

| 操作 | 方式 |
|------|------|
| 移动 | 左键拖拽菲比 |
| 菜单 | 右键（Token 统计 / 工作流 / 置顶 / 缩放） |
| 缩放 | 滚轮（0.3x ~ 3x） |
| 退出 | 托盘图标右键 → 退出 |

## 功能

- 5 状态动画：待机 / 思考 / 工作 / 完成 / 等待授权
- Token 统计弹窗（Claude Code）
- 工作流面板（TodoWrite 进度）
- 漫画气泡 + 位置/大小记忆

## 从源码构建（开发者）

需要 Node.js 18+ 与 Windows。

```powershell
git clone https://github.com/Squirtleeeee/Fbjbdesktoppet.git
cd Fbjbdesktoppet
npm install
npm run dist
```

产物在 `release/`：

- `菲比桌宠.exe` — 便携可执行文件
- `菲比桌宠-win.zip` — 可直接分发给用户的完整压缩包

开发调试：

```powershell
npm install
npm run dev
```

## 项目结构

```
├── electron/          # Electron 主进程
├── src/               # 渲染进程（Canvas 桌宠 UI）
├── assets/sprites/    # 菲比精灵帧
├── hooks/             # Claude / Cursor Hook 脚本
├── release-template/  # 打包附带的 bat / 说明
└── scripts/           # 发布脚本
```

## License

MIT
