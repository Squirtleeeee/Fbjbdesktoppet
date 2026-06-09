import { app, BrowserWindow, ipcMain, Menu, MenuItem, Tray, nativeImage } from 'electron'
import * as path from 'path'
import { createPetWindow, toggleAlwaysOnTop, isAlwaysOnTop, setScale, getStoredWindowState } from './window-manager'
import { startWsServer } from './ws-server'

let mainWindow: BrowserWindow | null = null
let wsServer: ReturnType<typeof startWsServer> | null = null
let tray: Tray | null = null
let isQuitting = false

// 托盘图标 — 从 idle 精灵生成
function createTrayIcon(): nativeImage {
  // 尝试从 assets 加载，降级用空图标
  const iconPaths = [
    path.join(__dirname, '../assets/sprites/idle/PhoebeX_038.png'),
    path.join(__dirname, '../dist/sprites/idle/PhoebeX_038.png'),
  ]
  for (const p of iconPaths) {
    try {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) {
        return img.resize({ width: 16, height: 16 })
      }
    } catch { /* try next */ }
  }
  // 降级：创建一个简单的 16x16 图标
  return nativeImage.createEmpty()
}

function buildTrayMenu(): Menu {
  const menu = new Menu()
  menu.append(new MenuItem({
    label: mainWindow?.isVisible() ? '👁 隐藏菲比' : '🐾 显示菲比',
    click: () => {
      if (!mainWindow) return
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    },
  }))
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: isAlwaysOnTop() ? '📍 取消置顶' : '📍 置顶窗口',
    click: () => {
      if (mainWindow) {
        toggleAlwaysOnTop(mainWindow)
      }
    },
  }))
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: '❌ 退出菲比',
    click: () => {
      isQuitting = true
      app.quit()
    },
  }))
  return menu
}

function setupTray(): void {
  const icon = createTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('菲比桌宠 — Claude Code 监视器')
  tray.setContextMenu(buildTrayMenu())

  // 单击托盘图标 = 显示/隐藏
  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // 每次右键打开菜单前刷新状态
  tray.on('right-click', () => {
    tray?.setContextMenu(buildTrayMenu())
  })
}

function buildPetContextMenu(): Menu {
  const menu = new Menu()
  menu.append(new MenuItem({
    label: isAlwaysOnTop() ? '📍 取消置顶' : '📍 置顶窗口',
    click: () => {
      if (mainWindow) {
        toggleAlwaysOnTop(mainWindow)
      }
    },
  }))
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: '🔍 缩放: 0.5x',
    click: () => { setScale(0.5); mainWindow?.webContents.send('scale-changed', 0.5) },
  }))
  menu.append(new MenuItem({
    label: '🔍 缩放: 1x (默认)',
    click: () => { setScale(1); mainWindow?.webContents.send('scale-changed', 1) },
  }))
  menu.append(new MenuItem({
    label: '🔍 缩放: 2x',
    click: () => { setScale(2); mainWindow?.webContents.send('scale-changed', 2) },
  }))
  menu.append(new MenuItem({
    label: '🔍 缩放: 3x',
    click: () => { setScale(3); mainWindow?.webContents.send('scale-changed', 3) },
  }))
  menu.append(new MenuItem({ type: 'separator' }))
  menu.append(new MenuItem({
    label: '➖ 隐藏到托盘',
    click: () => mainWindow?.hide(),
  }))
  menu.append(new MenuItem({ label: '❌ 退出', click: () => { isQuitting = true; app.quit() } }))
  return menu
}

function createWindow(): void {
  mainWindow = createPetWindow()

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 宠物右键菜单
  mainWindow.webContents.on('context-menu', () => {
    buildPetContextMenu().popup({ window: mainWindow! })
  })

  // 关闭按钮 → 隐藏到托盘（不是退出）
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // IPC
  ipcMain.handle('toggle-always-on-top', () => {
    return mainWindow ? toggleAlwaysOnTop(mainWindow) : false
  })
  ipcMain.handle('is-always-on-top', () => isAlwaysOnTop())
  ipcMain.handle('get-scale', () => getStoredWindowState().scale)

  // WS Server
  wsServer = startWsServer(mainWindow)
}

app.whenReady().then(() => {
  createWindow()
  setupTray()
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // 不退出 — 托盘保持运行
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
})
