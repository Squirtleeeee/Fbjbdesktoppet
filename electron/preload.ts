import { contextBridge, ipcRenderer } from 'electron'

export interface PetEventFromMain {
  type: 'state_change'
  state: 'idle' | 'thinking' | 'working' | 'done' | 'waiting_auth'
  payload?: Record<string, unknown>
}

export interface WorkflowEventFromMain {
  type: 'workflow_update'
  steps: { content: string; status: 'pending' | 'in_progress' | 'completed' }[]
  current: number
}

export interface TokenEventFromMain {
  type: 'token_update'
  tokens: {
    input: number
    output: number
    cacheRead: number
    cacheCreate: number
    total: number
  }
  projectKey?: string
  transcriptKey?: string
  finalize?: boolean
  source?: 'claude-code' | 'cursor'
}

export interface SessionStartEventFromMain {
  type: 'session_start'
}

export type EventFromMain = PetEventFromMain | WorkflowEventFromMain | TokenEventFromMain | SessionStartEventFromMain

contextBridge.exposeInMainWorld('petAPI', {
  onEvent: (callback: (event: EventFromMain) => void) => {
    ipcRenderer.on('pet-event', (_event, data: EventFromMain) => {
      callback(data)
    })
  },
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action: string) => {
      callback(action)
    })
  },
  // 右键菜单
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  // 鼠标穿透控制
  setMouseEvents: (ignore: boolean) => ipcRenderer.send('set-mouse-events', ignore),
  // 主进程拖拽
  startDrag: () => ipcRenderer.send('start-drag'),
  stopDrag: () => ipcRenderer.send('stop-drag'),
  // 持久化缩放
  saveScale: (scale: number) => ipcRenderer.send('save-scale', scale),
  // Token 数据回传
  sendTokenData: (data: unknown) => ipcRenderer.send('token-data-response', data),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top'),
  getScale: () => ipcRenderer.invoke('get-scale'),
  isAlwaysOnTopSync: () => ipcRenderer.sendSync('is-always-on-top-sync'), // eslint-disable-line deprecation/deprecation
})
