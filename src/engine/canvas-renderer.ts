import type { PetState } from './state-machine'
import type { SpriteManager } from './sprite-manager'
import type { Animator } from './animator'
import type { EffectState, CharacterTransform } from './effects/state-effects'

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animFrameId = 0
  private lastTime = 0
  private scale = 1
  private running = false
  private elapsed = 0     // 当前状态已过时间

  private spriteManager: SpriteManager | null = null
  private animator: Animator | null = null
  private currentPetState: PetState = 'idle'
  private currentEffect: EffectState | null = null

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

  setPetState(state: PetState, effect: EffectState): void {
    this.currentPetState = state
    this.currentEffect = effect
    this.elapsed = 0
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
    const dt = Math.min(now - this.lastTime, 100) // 防止大帧跳跃
    this.lastTime = now
    this.elapsed += dt

    this.animator?.update(dt)
    this.currentEffect?.update(dt)
    this.draw()

    this.animFrameId = requestAnimationFrame(this.loop)
  }

  private draw(): void {
    const sm = this.spriteManager
    const anim = this.animator
    const effect = this.currentEffect
    if (!sm || !anim) return

    const ctx = this.ctx
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, w, h)

    // 宠物尺寸 + 中心/顶部坐标
    const petSize = Math.min(w, h - 30) * this.scale
    const petCenterX = w / 2
    const petCenterY = (h - petSize - 20) / 2 + petSize / 2
    const petTopY = (h - petSize - 20) / 2

    // 获取角色变换
    const transform: CharacterTransform = effect
      ? effect.getTransform(this.elapsed, 16)
      : { offsetX: 0, offsetY: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, flipH: false }

    try {
      const frames = sm.getFrames(this.currentPetState)
      if (frames.length > 0 && anim.currentFrame < frames.length) {
        const frame = frames[anim.currentFrame]

        ctx.save()

        // 移动到宠物中心
        ctx.translate(petCenterX + transform.offsetX, petCenterY + transform.offsetY)
        // 旋转
        if (transform.rotation) ctx.rotate(transform.rotation)
        // 缩放
        const sx = transform.scaleX * (transform.flipH ? -1 : 1)
        const sy = transform.scaleY
        // 透明度
        ctx.globalAlpha = transform.alpha

        // 绘制精灵（居中绘制）
        ctx.drawImage(
          frame,
          -petSize / 2 * sx,
          -petSize / 2 * sy,
          petSize * Math.abs(sx),
          petSize * Math.abs(sy)
        )

        ctx.restore()

        // 绘制道具（键盘、气泡等）
        if (effect) {
          ctx.save()
          effect.drawProps(ctx, petCenterX, petCenterY, petSize)
          ctx.restore()

          // 绘制粒子
          ctx.save()
          effect.drawParticles(ctx, petCenterX, petTopY)
          ctx.restore()
        }
      }
    } catch {
      // 精灵未加载，跳过
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}
