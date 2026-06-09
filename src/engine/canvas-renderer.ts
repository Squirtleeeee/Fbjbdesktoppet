import type { PetState } from './state-machine'
import type { SpriteManager } from './sprite-manager'
import type { Animator } from './animator'

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animFrameId = 0
  private lastTime = 0
  private scale = 1
  private running = false

  private spriteManager: SpriteManager | null = null
  private animator: Animator | null = null
  private currentPetState: PetState = 'idle'

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
  }

  setScale(scale: number): void {
    this.scale = scale
    this.resize()
  }

  setSpriteManager(sm: SpriteManager): void { this.spriteManager = sm }
  setAnimator(animator: Animator): void { this.animator = animator }

  setPetState(state: PetState): void {
    this.currentPetState = state
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.resize()
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
  }

  resize(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private loop = (now: number): void => {
    if (!this.running) return
    const dt = Math.min(now - this.lastTime, 100)
    this.lastTime = now

    this.animator?.update(dt)
    this.draw()

    this.animFrameId = requestAnimationFrame(this.loop)
  }

  private draw(): void {
    const sm = this.spriteManager
    const anim = this.animator
    if (!sm || !anim) return

    const ctx = this.ctx
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, w, h)

    const petSize = Math.min(w, h) * this.scale
    const petX = (w - petSize) / 2
    const petY = (h - petSize) / 2

    try {
      const frames = sm.getFrames(this.currentPetState)
      if (frames.length > 0 && anim.currentFrame < frames.length) {
        ctx.drawImage(frames[anim.currentFrame], petX, petY, petSize, petSize)
      }
    } catch {
      // 精灵未加载
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}
