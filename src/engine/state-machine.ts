export type PetState = 'idle' | 'thinking' | 'working' | 'done' | 'waiting_auth'

export interface StateTransition {
  from: PetState
  to: PetState
}

type StateListener = (from: PetState, to: PetState) => void

export class StateMachine {
  private current: PetState = 'idle'
  private listeners: Set<StateListener> = new Set()
  private doneTimer: ReturnType<typeof setTimeout> | null = null

  // Working→Done→Idle 自动回落
  private readonly DONE_DURATION = 3000

  get state(): PetState {
    return this.current
  }

  transition(to: PetState): void {
    const from = this.current

    // 不允许的转换
    if (from === to) return

    // Done → Idle 自动转换，不接受其他
    if (from === 'done' && to !== 'idle') return

    // 清除之前的 done timer
    if (this.doneTimer) {
      clearTimeout(this.doneTimer)
      this.doneTimer = null
    }

    this.current = to
    this.notify(from, to)

    // Done 状态自动回落
    if (to === 'done') {
      this.doneTimer = setTimeout(() => {
        this.transitionToIdle()
      }, this.DONE_DURATION)
    }
  }

  private transitionToIdle(): void {
    const from = this.current
    this.current = 'idle'
    this.notify(from, 'idle')
  }

  onTransition(fn: StateListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify(from: PetState, to: PetState): void {
    this.listeners.forEach(fn => fn(from, to))
  }

  destroy(): void {
    if (this.doneTimer) clearTimeout(this.doneTimer)
    this.listeners.clear()
  }
}
