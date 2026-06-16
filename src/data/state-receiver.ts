import type { PetState } from '../engine/state-machine'
import type { TokenStats } from './token-tracker'
import type { WorkflowStep } from '../ui/workflow-panel'

export interface TokenUpdatePayload extends TokenStats {
  projectKey?: string
  transcriptKey?: string
  finalize?: boolean
  source?: 'claude-code' | 'cursor'
}

export type StateChangeHandler = (state: PetState) => void
export type TokenUpdateHandler = (data: TokenUpdatePayload) => void
export type WorkflowUpdateHandler = (steps: WorkflowStep[], currentIndex: number) => void
export type ActivityHandler = () => void
export type SessionStartHandler = () => void

export class StateReceiver {
  private stateHandlers: Set<StateChangeHandler> = new Set()
  private tokenHandlers: Set<TokenUpdateHandler> = new Set()
  private workflowHandlers: Set<WorkflowUpdateHandler> = new Set()
  private activityHandlers: Set<ActivityHandler> = new Set()
  private sessionHandlers: Set<SessionStartHandler> = new Set()

  start(): void {
    window.petAPI.onEvent((event: EventFromMain) => {
      this.notifyActivity()

      switch (event.type) {
        case 'state_change':
          this.stateHandlers.forEach(h => h(event.state))
          break
        case 'token_update':
          this.tokenHandlers.forEach(h => h({
            ...event.tokens,
            projectKey: event.projectKey,
            transcriptKey: event.transcriptKey,
            finalize: event.finalize,
            source: event.source,
          }))
          break
        case 'workflow_update':
          this.workflowHandlers.forEach(h => h(event.steps, event.current ?? -1))
          break
        case 'session_start':
          this.sessionHandlers.forEach(h => h())
          this.stateHandlers.forEach(h => h('idle'))
          break
      }
    })
  }

  private notifyActivity(): void {
    this.activityHandlers.forEach(h => h())
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  onTokenUpdate(handler: TokenUpdateHandler): () => void {
    this.tokenHandlers.add(handler)
    return () => this.tokenHandlers.delete(handler)
  }

  onWorkflowUpdate(handler: WorkflowUpdateHandler): () => void {
    this.workflowHandlers.add(handler)
    return () => this.workflowHandlers.delete(handler)
  }

  onActivity(handler: ActivityHandler): () => void {
    this.activityHandlers.add(handler)
    return () => this.activityHandlers.delete(handler)
  }

  onSessionStart(handler: SessionStartHandler): () => void {
    this.sessionHandlers.add(handler)
    return () => this.sessionHandlers.delete(handler)
  }

  destroy(): void {
    this.stateHandlers.clear()
    this.tokenHandlers.clear()
    this.workflowHandlers.clear()
    this.activityHandlers.clear()
    this.sessionHandlers.clear()
  }
}
