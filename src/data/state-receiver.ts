import type { PetState } from '../engine/state-machine'
import type { TokenData } from '../ui/token-bar'
import type { WorkflowStep } from '../ui/workflow-panel'

export type StateChangeHandler = (state: PetState) => void
export type TokenUpdateHandler = (data: TokenData) => void
export type WorkflowUpdateHandler = (steps: WorkflowStep[]) => void

export class StateReceiver {
  private stateHandlers: Set<StateChangeHandler> = new Set()
  private tokenHandlers: Set<TokenUpdateHandler> = new Set()
  private workflowHandlers: Set<WorkflowUpdateHandler> = new Set()

  start(): void {
    window.petAPI.onEvent((event: EventFromMain) => {
      switch (event.type) {
        case 'state_change':
          this.stateHandlers.forEach(h => h(event.state))
          break
        case 'token_update':
          this.tokenHandlers.forEach(h => h(event.tokens))
          break
        case 'workflow_update':
          this.workflowHandlers.forEach(h => h(event.steps))
          break
      }
    })
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

  destroy(): void {
    this.stateHandlers.clear()
    this.tokenHandlers.clear()
    this.workflowHandlers.clear()
  }
}
