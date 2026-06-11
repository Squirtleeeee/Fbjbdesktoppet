import { app, BrowserWindow, ipcMain, Menu, MenuItem, Tray, nativeImage, screen } from 'electron'
import * as path from 'path'
import { createPetWindow, toggleAlwaysOnTop, isAlwaysOnTop, setScale, getStoredWindowState, setMouseEvents, getDefaultPosition } from './window-manager'
import { startWsServer } from './ws-server'

let mainWindow: BrowserWindow | null = null
let wsServer: ReturnType<typeof startWsServer> | null = null
let tray: Tray | null = null
let isQuitting = false

// ──── 托盘图标 ────
function createTrayIcon(): nativeImage {
  const iconPaths = [
    path.join(__dirname, '../assets/sprites/idle/frame_03.png'),
    path.join(__dirname, '../dist/sprites/idle/frame_03.png'),
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
      label: mainWindow?.isVisible() ? '👁 隐藏桌宠' : '🐾 显示桌宠',
      click: () => {
        if (!mainWindow) return
        mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus())
      },
    },
    {
      label: isAlwaysOnTop() ? '📍 取消置顶' : '📍 置顶窗口',
      click: () => { if (mainWindow) toggleAlwaysOnTop(mainWindow) },
    },
    {
      label: '🏠 重置位置',
      click: () => {
        if (!mainWindow) return
        const size = mainWindow.getSize()
        const pos = getDefaultPosition(size[0], size[1])
        mainWindow.setPosition(pos.x, pos.y)
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    { label: '❌ 退出', click: () => { isQuitting = true; app.quit() } },
  ])
}

function setupTray(): void {
  tray = new Tray(createTrayIcon())
  tray.setToolTip('桌宠 — Claude Code 监视器')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', () => {
    if (!mainWindow) return
    mainWindow.isVisible() ? mainWindow.hide() : (mainWindow.show(), mainWindow.focus())
  })
}

// ──── Token 弹窗 ────
let tokenPopup: BrowserWindow | null = null

function openTokenPopup(): void {
  if (tokenPopup && !tokenPopup.isDestroyed()) {
    tokenPopup.focus()
    return
  }
  tokenPopup = new BrowserWindow({
    width: 420, height: 520,
    parent: mainWindow!,
    modal: false,
    frame: true,
    resizable: true,
    title: 'Token 统计',
    webPreferences: {
      preload: require('path').join(__dirname, 'preload-popup.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  const popupPath = path.join(__dirname, '../dist/token-popup.html')
  tokenPopup.loadFile(popupPath)
  tokenPopup.on('closed', () => { tokenPopup = null })

  tokenPopup.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('menu-action', 'request-token-data')
  })
}

// ──── 宠物右键菜单 ────
function buildPetContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '📊 Token 统计',
      click: () => openTokenPopup(),
    },
    {
      label: '📋 工作流',
      click: () => mainWindow?.webContents.send('menu-action', 'show-workflow'),
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
  // 右键菜单
  ipcMain.on('show-context-menu', () => {
    buildPetContextMenu().popup({ window: mainWindow! })
  })

  // 鼠标穿透控制
  ipcMain.on('set-mouse-events', (_event, ignore: boolean) => {
    if (mainWindow) setMouseEvents(mainWindow, ignore)
  })

  // ──── 主进程拖拽（fix DPI 缩放漂移）───
  let dragInterval: ReturnType<typeof setInterval> | null = null

  ipcMain.on('start-drag', () => {
    if (!mainWindow || dragInterval) return
    const startMouse = screen.getCursorScreenPoint()
    const [startX, startY] = mainWindow.getPosition()
    const [winW, winH] = mainWindow.getSize()
    const display = screen.getPrimaryDisplay()
    const { workArea } = display
    const DEAD_ZONE = 3

    dragInterval = setInterval(() => {
      if (!mainWindow) { clearInterval(dragInterval!); dragInterval = null; return }
      const now = screen.getCursorScreenPoint()
      const dx = now.x - startMouse.x
      const dy = now.y - startMouse.y
      if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return
      const newX = Math.round(Math.max(workArea.x - winW + 50, Math.min(workArea.x + workArea.width - 50, startX + dx)))
      const newY = Math.round(Math.max(workArea.y - winH + 50, Math.min(workArea.y + workArea.height - 50, startY + dy)))
      // 用 setBounds 固定宽高，防止 DPI 缩放导致窗口变大
      mainWindow.setBounds({ x: newX, y: newY, width: winW, height: winH })
    }, 16)
  })

  ipcMain.on('stop-drag', () => {
    if (dragInterval) { clearInterval(dragInterval); dragInterval = null }
  })

  // 持久化缩放
  ipcMain.on('save-scale', (_event, scale: number) => {
    setScale(scale)
  })

  // Popup 发送请求 → 转发给主渲染进程
  ipcMain.on('request-token-data', () => {
    mainWindow?.webContents.send('menu-action', 'request-token-data')
  })

  // 主渲染进程返回 token 数据 → 转发给 popup
  ipcMain.on('token-data-response', (_event, data: unknown) => {
    if (tokenPopup && !tokenPopup.isDestroyed()) {
      tokenPopup.webContents.send('token-data-response', data)
    }
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
