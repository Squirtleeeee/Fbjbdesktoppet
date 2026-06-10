import { StateMachine, type PetState } from '../engine/state-machine'
import { SpriteManager } from '../engine/sprite-manager'
import { Animator, ANIM_CONFIGS } from '../engine/animator'
import { CanvasRenderer } from '../engine/canvas-renderer'
import type { SpeechBubble } from '../ui/speech-bubble'
import type { WorkflowPanel } from '../ui/workflow-panel'

export class Pet {
  private stateMachine: StateMachine
  private spriteManager: SpriteManager
  private animator: Animator
  private renderer: CanvasRenderer
  private speechBubble: SpeechBubble | null = null
  private workflowPanel: WorkflowPanel | null = null

  constructor(container: HTMLElement) {
    this.stateMachine = new StateMachine()
    this.spriteManager = new SpriteManager()
    this.renderer = new CanvasRenderer(container)

    const config = ANIM_CONFIGS.idle
    const frameCount = this.spriteManager.getFrameCount('idle')
    this.animator = new Animator(config, frameCount)

    this.renderer.setSpriteManager(this.spriteManager)
    this.renderer.setAnimator(this.animator)

    this.stateMachine.onTransition((_from, to) => {
      this.onStateChange(to)
    })
  }

  async init(): Promise<void> {
    await this.spriteManager.loadAll()
    this.renderer.setPetState('idle')
    this.renderer.start()
  }

  setSpeechBubble(sb: SpeechBubble): void { this.speechBubble = sb }
  setWorkflowPanel(wp: WorkflowPanel): void { this.workflowPanel = wp }

  setState(state: PetState): void {
    this.stateMachine.transition(state)
  }

  private onStateChange(to: PetState): void {
    const config = ANIM_CONFIGS[to]
    const frameCount = this.spriteManager.getFrameCount(to)
    this.animator.reset(config, frameCount)
    this.renderer.setPetState(to)

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

  getRenderer(): CanvasRenderer {
    return this.renderer
  }

  destroy(): void {
    this.renderer.stop()
    this.stateMachine.destroy()
  }
}
