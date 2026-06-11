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
  projectKey?: string
  transcriptKey?: string
  finalize?: boolean
  source?: 'claude-code' | 'cursor'
}

interface SessionStartEventFromMain {
  type: 'session_start'
}

type EventFromMain = PetEventFromMain | WorkflowEventFromMain | TokenEventFromMain | SessionStartEventFromMain

interface PetAPI {
  onEvent: (callback: (event: EventFromMain) => void) => void
  onMenuAction: (callback: (action: string) => void) => void
  showContextMenu: () => void
  setMouseEvents: (ignore: boolean) => void
  startDrag: () => void
  stopDrag: () => void
  saveScale: (scale: number) => void
  sendTokenData: (data: unknown) => void
  toggleAlwaysOnTop: () => Promise<boolean>
  isAlwaysOnTop: () => Promise<boolean>
  getScale: () => Promise<number>
  isAlwaysOnTopSync: () => boolean
}

interface Window {
  petAPI: PetAPI
}
