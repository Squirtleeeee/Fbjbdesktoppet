/// <reference types="vite/client" />

interface PetEventFromMain {
  type: 'state_change'
  state: 'idle' | 'thinking' | 'working' | 'done' | 'waiting_auth'
  payload?: Record<string, unknown>
}

interface WorkflowEventFromMain {
  type: 'workflow_update'
  steps: { content: string; status: 'pending' | 'in_progress' | 'completed' }[]
  current: number
}

interface TokenEventFromMain {
  type: 'token_update'
  tokens: {
    input: number
    output: number
    cacheRead: number
    cacheCreate: number
    total: number
  }
}

type EventFromMain = PetEventFromMain | WorkflowEventFromMain | TokenEventFromMain

interface PetAPI {
  onEvent: (callback: (event: EventFromMain) => void) => void
  onMenuAction: (callback: (action: string) => void) => void
  showContextMenu: () => void
  toggleAlwaysOnTop: () => Promise<boolean>
  isAlwaysOnTop: () => Promise<boolean>
  getScale: () => Promise<number>
  isAlwaysOnTopSync: () => boolean
}

interface Window {
  petAPI: PetAPI
}
