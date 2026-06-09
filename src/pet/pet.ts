import { StateMachine, type PetState } from '../engine/state-machine'
import { SpriteManager } from '../engine/sprite-manager'
import { Animator, ANIM_CONFIGS } from '../engine/animator'
import { CanvasRenderer } from '../engine/canvas-renderer'
import { createEffectForState, type EffectState } from '../engine/effects/state-effects'
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

  // 每状态特效缓存
  private effects: Map<PetState, EffectState> = new Map()

  constructor(container: HTMLElement) {
    this.stateMachine = new StateMachine()
    this.spriteManager = new SpriteManager()
    this.renderer = new CanvasRenderer(container)

    const config = ANIM_CONFIGS.idle
    const frameCount = this.getFrameCountForState('idle')
    this.animator = new Animator(config, frameCount)

    this.renderer.setSpriteManager(this.spriteManager)
    this.renderer.setAnimator(this.animator)

    // 预创建所有特效
    const states: PetState[] = ['idle', 'thinking', 'working', 'done', 'waiting_auth']
    for (const s of states) {
      this.effects.set(s, createEffectForState(s))
    }

    this.stateMachine.onTransition((_from, to) => {
      this.onStateChange(to)
    })
  }

  private getFrameCountForState(state: PetState): number {
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
    // 初始状态 idle + 特效
    const idleEffect = this.effects.get('idle')!
    idleEffect.reset()
    this.renderer.setPetState('idle', idleEffect)
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

    // 特效切换
    const effect = this.effects.get(to)
    if (effect) {
      effect.reset()
      this.renderer.setPetState(to, effect)
    }

    // UI 面板
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
