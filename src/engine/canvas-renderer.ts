import type { PetState } from './state-machine'
import type { SpriteManager } from './sprite-manager'
import type { Animator } from './animator'

// 存储精灵渲染位置（供 hit test 用）
interface SpriteRect {
  x: number
  y: number
  size: number
}

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

  // 当前帧精灵区域
  private spriteRect: SpriteRect = { x: 0, y: 0, size: 0 }

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
  }

  private BASE_SIZE = 200

  getScale(): number { return this.scale }
  getPetPixelSize(): number { return this.BASE_SIZE * this.scale }

  setScale(scale: number): void {
    this.scale = scale
    this.resize()
    this.updateSpriteRect()
  }

  /** 立即更新精灵区域，不等下一帧 draw */
  private updateSpriteRect(): void {
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)
    const petSize = this.BASE_SIZE * this.scale
    this.spriteRect = {
      x: (w - petSize) / 2,
      y: (h - petSize) / 2,
      size: petSize,
    }
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

    this.updateSpriteRect()
    const { x: petX, y: petY, size: petSize } = this.spriteRect

    try {
      const frames = sm.getFrames(this.currentPetState)
      if (frames.length > 0 && anim.currentFrame < frames.length) {
        ctx.drawImage(frames[anim.currentFrame], petX, petY, petSize, petSize)
      }
    } catch {
      // 精灵未加载
    }
  }

  /**
   * 像素级碰撞检测：检查鼠标是否在当前帧的非透明像素上
   * @param mouseX 窗口内鼠标 X (CSS 坐标)
   * @param mouseY 窗口内鼠标 Y (CSS 坐标)
   */
  hitTest(mouseX: number, mouseY: number): boolean {
    const rect = this.spriteRect
    if (rect.size <= 0) return false

    const sm = this.spriteManager
    const anim = this.animator
    if (!sm || !anim) return false

    // 鼠标是否在精灵矩形内
    if (mouseX < rect.x || mouseX > rect.x + rect.size ||
        mouseY < rect.y || mouseY > rect.y + rect.size) {
      return false
    }

    // 像素级检测
    try {
      const frames = sm.getFrames(this.currentPetState)
      if (frames.length === 0 || anim.currentFrame >= frames.length) return false

      const frame = frames[anim.currentFrame]
      // 计算精灵内相对坐标
      const fx = (mouseX - rect.x) / rect.size * frame.width
      const fy = (mouseY - rect.y) / rect.size * frame.height

      // 使用离屏 canvas 检测 alpha
      if (!this._hitCanvas) {
        this._hitCanvas = document.createElement('canvas')
        this._hitCtx = this._hitCanvas.getContext('2d')!
      }
      this._hitCanvas.width = frame.width
      this._hitCanvas.height = frame.height
      this._hitCtx!.drawImage(frame, 0, 0)

      const px = Math.floor(fx)
      const py = Math.floor(fy)
      if (px < 0 || px >= frame.width || py < 0 || py >= frame.height) return false

      const pixel = this._hitCtx!.getImageData(px, py, 1, 1).data
      return pixel[3] > 20 // alpha > 20 = 非透明
    } catch {
      return false
    }
  }

  private _hitCanvas: HTMLCanvasElement | null = null
  private _hitCtx: CanvasRenderingContext2D | null = null

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }
}
