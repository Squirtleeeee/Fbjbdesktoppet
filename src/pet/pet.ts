import { StateMachine, type PetState } from '../engine/state-machine'
import { SpriteManager } from '../engine/sprite-manager'
import { Animator, ANIM_CONFIGS } from '../engine/animator'
import { CanvasRenderer } from '../engine/canvas-renderer'
import type { SpeechBubble } from '../ui/speech-bubble'
import type { TokenBar } from '../ui/token-bar'
import type { WorkflowPanel } from '../ui/workflow-panel'

export class Pet {
  private stateMachine: StateMachine
  private spriteManager: SpriteManager
  private animator: Animator
  private renderer: CanvasRenderer
  private speechBubble: SpeechBubble | null = null
  private tokenBar: TokenBar | null = null
  private workflowPanel: WorkflowPanel | null = null

  constructor(container: HTMLElement) {
    this.stateMachine = new StateMachine()
    this.spriteManager = new SpriteManager()
    this.renderer = new CanvasRenderer(container)

    // 初始 animator (idle)
    const config = ANIM_CONFIGS.idle
    const frameCount = this.getFrameCountForState('idle')
    this.animator = new Animator(config, frameCount)

    this.renderer.setSpriteManager(this.spriteManager)
    this.renderer.setAnimator(this.animator)

    // 状态变化 → 切换动画
    this.stateMachine.onTransition((_from, to) => {
      this.onStateChange(to)
    })
  }

  private getFrameCountForState(state: PetState): number {
    // 从 sprite manager 获取，但加载前先用映射估算
    const counts: Record<PetState, number> = {
      idle: 6,
      thinking: 4,
      working: 4,
      done: 3,
      waiting_auth: 5,
    }
    return counts[state]
  }

  async init(): Promise<void> {
    await this.spriteManager.loadAll()
    this.renderer.start()
  }

  setSpeechBubble(sb: SpeechBubble): void { this.speechBubble = sb }
  setTokenBar(tb: TokenBar): void { this.tokenBar = tb }
  setWorkflowPanel(wp: WorkflowPanel): void { this.workflowPanel = wp }

  setState(state: PetState): void {
    this.stateMachine.transition(state)
  }

  private onStateChange(to: PetState): void {
    const config = ANIM_CONFIGS[to]
    const frames = this.spriteManager.getFrames(to)
    this.animator.reset(config, frames.length)
    this.renderer.setPetState(to)

    // UI 面板显隐
    if (to === 'working') {
      this.workflowPanel?.show()
    } else {
      this.workflowPanel?.hide()
    }

    // 气泡
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
