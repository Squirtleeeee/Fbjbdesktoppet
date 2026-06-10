import { StateMachine, type PetState } from '../engine/state-machine'
import { Live2DRenderer } from '../engine/live2d-renderer'
import type { SpeechBubble } from '../ui/speech-bubble'
import type { TokenBar } from '../ui/token-bar'
import type { WorkflowPanel } from '../ui/workflow-panel'

export class Pet {
  private stateMachine: StateMachine
  private renderer: Live2DRenderer
  private speechBubble: SpeechBubble | null = null
  private tokenBar: TokenBar | null = null
  private workflowPanel: WorkflowPanel | null = null

  constructor(container: HTMLElement) {
    this.stateMachine = new StateMachine()
    this.renderer = new Live2DRenderer(container)

    this.stateMachine.onTransition((_from, to) => {
      this.onStateChange(to)
    })
  }

  async init(): Promise<void> {
    await this.renderer.init()
  }

  setSpeechBubble(sb: SpeechBubble): void { this.speechBubble = sb }
  setTokenBar(tb: TokenBar): void { this.tokenBar = tb }
  setWorkflowPanel(wp: WorkflowPanel): void { this.workflowPanel = wp }

  setState(state: PetState): void {
    this.stateMachine.transition(state)
  }

  private onStateChange(to: PetState): void {
    this.renderer.setState(to)

    if (to === 'working') {
      this.workflowPanel?.show()
    } else {
      this.workflowPanel?.hide()
    }

    this.speechBubble?.showForState(to)
  }

  getState(): PetState {
    return this.stateMachine.state
  }

  getRenderer(): Live2DRenderer {
    return this.renderer
  }

  destroy(): void {
    this.renderer.destroy()
    this.stateMachine.destroy()
  }
}
