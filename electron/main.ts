import { app, BrowserWindow, ipcMain, Menu, MenuItem, Tray, nativeImage } from 'electron'
import * as path from 'path'
import { createPetWindow, toggleAlwaysOnTop, isAlwaysOnTop, setScale, getStoredWindowState } from './window-manager'
import { startWsServer } from './ws-server'

let mainWindow: BrowserWindow | null = null
let wsServer: ReturnType<typeof startWsServer> | null = null
let tray: Tray | null = null
let isQuitting = false

// ──── 托盘图标 ────
function createTrayIcon(): nativeImage {
  const iconPaths = [
    path.join(__dirname, '../assets/sprites/idle/PhoebeX_038.png'),
    path.join(__dirname, '../dist/sprites/idle/PhoebeX_038.png'),
  ]
  for (const p of iconPaths) {
    try {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img.resize({ width: 16, height: 16 })
    } catch { /* try next */ }
  }
  return nativeImage.createEmpty()
}

function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? '👁 隐藏菲比' : '🐾 显示菲比',
      click: () => {
        if (!mainWindow) return
        mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus())
      },
    },
    {
      label: isAlwaysOnTop() ? '📍 取消置顶' : '📍 置顶窗口',
      click: () => { if (mainWindow) toggleAlwaysOnTop(mainWindow) },
    },
    { type: 'separator' },
    { label: '❌ 退出菲比', click: () => { isQuitting = true; app.quit() } },
  ])
}

function setupTray(): void {
  tray = new Tray(createTrayIcon())
  tray.setToolTip('菲比桌宠 — Claude Code 监视器')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus())
  })
}

// ──── 宠物右键菜单 ────
function buildPetContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '📊 Token 统计',
      click: () => mainWindow?.webContents.send('menu-action', 'toggle-token'),
    },
    {
      label: '📋 工作流',
      click: () => mainWindow?.webContents.send('menu-action', 'toggle-workflow'),
    },
    { type: 'separator' },
    {
      label: isAlwaysOnTop() ? '📍 置顶 (开)  ✓' : '📍 置顶 (关)',
      click: () => {
        if (mainWindow) toggleAlwaysOnTop(mainWindow)
      },
    },
    {
      label: '🔍 缩放',
      submenu: [
        { label: '0.5x', click: () => { setScale(0.5); mainWindow?.webContents.send('menu-action', 'scale-0.5') } },
        { label: '1x (默认)', click: () => { setScale(1); mainWindow?.webContents.send('menu-action', 'scale-1') } },
        { label: '2x', click: () => { setScale(2); mainWindow?.webContents.send('menu-action', 'scale-2') } },
        { label: '3x', click: () => { setScale(3); mainWindow?.webContents.send('menu-action', 'scale-3') } },
      ],
    },
    { type: 'separator' },
    { label: '➖ 隐藏到托盘', click: () => mainWindow?.hide() },
    { label: '❌ 退出', click: () => { isQuitting = true; app.quit() } },
  ])
}

// ──── 窗口创建 ────
function createWindow(): void {
  mainWindow = createPetWindow()

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 关闭 → 隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!isQuitting) { event.preventDefault(); mainWindow?.hide() }
  })
  mainWindow.on('closed', () => { mainWindow = null })

  // ──── IPC ────
  // 渲染进程请求弹出右键菜单
  ipcMain.on('show-context-menu', () => {
    buildPetContextMenu().popup({ window: mainWindow! })
  })

  ipcMain.handle('toggle-always-on-top', () => {
    return mainWindow ? toggleAlwaysOnTop(mainWindow) : false
  })
  ipcMain.handle('is-always-on-top', () => isAlwaysOnTop())
  ipcMain.on('is-always-on-top-sync', (event) => {
    event.returnValue = isAlwaysOnTop()
  })
  ipcMain.handle('get-scale', () => getStoredWindowState().scale)

  wsServer = startWsServer(mainWindow)
}

// ──── 生命周期 ────
app.whenReady().then(() => {
  createWindow()
  setupTray()
})

app.on('before-quit', () => { isQuitting = true })
app.on('window-all-closed', () => { /* 托盘保持 */ })
app.on('activate', () => {
  if (mainWindow) { mainWindow.show(); mainWindow.focus() }
})
