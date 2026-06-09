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
}

export type EventFromMain = PetEventFromMain | WorkflowEventFromMain | TokenEventFromMain

contextBridge.exposeInMainWorld('petAPI', {
  onEvent: (callback: (event: EventFromMain) => void) => {
    ipcRenderer.on('pet-event', (_event, data: EventFromMain) => {
      callback(data)
    })
  },
  // 监听主进程菜单动作
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action: string) => {
      callback(action)
    })
  },
  // 右键 → 通知主进程弹出菜单
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top'),
  getScale: () => ipcRenderer.invoke('get-scale'),
  isAlwaysOnTopSync: () => ipcRenderer.sendSync('is-always-on-top-sync'),
})
