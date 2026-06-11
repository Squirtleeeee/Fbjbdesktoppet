import { BrowserWindow, screen } from 'electron'
import Store from 'electron-store'

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  alwaysOnTop: boolean
  scale: number
}

const store = new Store<WindowState>({
  defaults: {
    width: 200,
    height: 280,
    alwaysOnTop: true,
    scale: 1,
  },
})

export function getStoredWindowState(): WindowState {
  return {
    x: store.get('x'),
    y: store.get('y'),
    width: store.get('width'),
    height: store.get('height'),
    alwaysOnTop: store.get('alwaysOnTop'),
    scale: store.get('scale'),
  }
}

export function getDefaultPosition(width: number, height: number): { x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const { workArea } = display
  return {
    x: workArea.x + workArea.width - width - 20,
    y: workArea.y + workArea.height - height - 20,
  }
}

export function createPetWindow(): BrowserWindow {
  const state = getStoredWindowState()
  const pos = state.x !== undefined && state.y !== undefined
    ? { x: state.x, y: state.y }
    : getDefaultPosition(state.width, state.height)

  const win = new BrowserWindow({
    x: pos.x,
    y: pos.y,
    width: state.width,
    height: state.height,
    transparent: true,
    frame: false,
    alwaysOnTop: state.alwaysOnTop,
    resizable: true,
    skipTaskbar: false,
    hasShadow: false,
    title: '菲比桌宠',
    icon: require('path').join(__dirname, '../assets/sprites/idle/frame_03.png'),
    webPreferences: {
      preload: require('path').join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setAlwaysOnTop(state.alwaysOnTop, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true)

  // Save position on move (debounced)
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  win.on('move', () => {
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      const [x, y] = win.getPosition()
      store.set('x', x)
      store.set('y', y)
    }, 1000)
  })

  // Save size on resize
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  win.on('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const [w, h] = win.getSize()
      store.set('width', w)
      store.set('height', h)
    }, 500)
  })

  return win
}

export function toggleAlwaysOnTop(win: BrowserWindow): boolean {
  const current = win.isAlwaysOnTop()
  win.setAlwaysOnTop(!current, 'screen-saver')
  store.set('alwaysOnTop', !current)
  return !current
}

export function isAlwaysOnTop(): boolean {
  return store.get('alwaysOnTop')
}

export function setScale(scale: number): void {
  store.set('scale', Math.max(0.5, Math.min(3, scale)))
}

export function setMouseEvents(win: BrowserWindow, ignore: boolean): void {
  win.setIgnoreMouseEvents(ignore, { forward: true })
}
