import { StateMachine, type PetState } from '../engine/state-machine'
import { SpriteManager } from '../engine/sprite-manager'
import { Animator, ANIM_CONFIGS } from '../engine/animator'
import { CanvasRenderer } from '../engine/canvas-renderer'
import type { SpeechBubble } from '../ui/speech-bubble'

export class Pet {
  private stateMachine: StateMachine
  private spriteManager: SpriteManager
  private animator: Animator
  private renderer: CanvasRenderer
  private speechBubble: SpeechBubble | null = null

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

  setState(state: PetState): void {
    this.stateMachine.transition(state)
  }

  private onStateChange(to: PetState): void {
    const config = ANIM_CONFIGS[to]
    const frameCount = this.spriteManager.getFrameCount(to)
    this.animator.reset(config, frameCount)
    this.renderer.setPetState(to)
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
