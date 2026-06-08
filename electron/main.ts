import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
import { createPetWindow, toggleAlwaysOnTop, isAlwaysOnTop, setScale, getStoredWindowState } from './window-manager'
import { startWsServer } from './ws-server'

let mainWindow: BrowserWindow | null = null
let wsServer: ReturnType<typeof startWsServer> | null = null

function buildContextMenu(): Menu {
  const menu = new Menu()
  menu.append(new MenuItem({
    label: isAlwaysOnTop() ? '📍 取消置顶' : '📍 置顶窗口',
    click: () => {
      if (mainWindow) {
        const nowOnTop = toggleAlwaysOnTop(mainWindow)
        // Rebuild menu to reflect new state
        mainWindow.webContents.send('always-on-top-changed', nowOnTop)
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
  menu.append(new MenuItem({ label: '❌ 退出', click: () => app.quit() }))
  return menu
}

function createWindow(): void {
  mainWindow = createPetWindow()

  // Load renderer
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(require('path').join(__dirname, '../dist/index.html'))
  }

  // Context menu
  mainWindow.webContents.on('context-menu', () => {
    buildContextMenu().popup({ window: mainWindow! })
  })

  // IPC handlers
  ipcMain.handle('toggle-always-on-top', () => {
    return mainWindow ? toggleAlwaysOnTop(mainWindow) : false
  })
  ipcMain.handle('is-always-on-top', () => isAlwaysOnTop())
  ipcMain.handle('get-scale', () => {
    return getStoredWindowState().scale
  })

  // Start WebSocket server
  wsServer = startWsServer(mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  wsServer?.close()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
