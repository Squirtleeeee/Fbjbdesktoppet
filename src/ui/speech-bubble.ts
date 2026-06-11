import type { PetState } from '../engine/state-machine'
import { getRandomPhrase } from '../utils/speech'

export class SpeechBubble {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private timer: ReturnType<typeof setTimeout> | null = null
  private animTimer: ReturnType<typeof setTimeout> | null = null
  private alpha = 0
  private targetAlpha = 0
  private text = ''
  private animFrameId = 0
  private observer: ResizeObserver | null = null

  private readonly DISPLAY_DURATION = 2500
  private readonly FADE_DURATION = 350

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas')
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '10',
    })
    container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!

    // 跟随父容器大小
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()

    // 动画循环
    this.loop()
  }

  private resize(): void {
    const parent = this.canvas.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  showForState(state: PetState): void {
    this.show(getRandomPhrase(state))
  }

  show(text: string): void {
    if (this.timer) clearTimeout(this.timer)
    this.text = text
    this.targetAlpha = 1

    this.timer = setTimeout(() => {
      this.targetAlpha = 0
    }, this.DISPLAY_DURATION)
  }

  private loop = (): void => {
    // 平滑过渡
    const speed = 0.08
    this.alpha += (this.targetAlpha - this.alpha) * speed
    if (Math.abs(this.alpha - this.targetAlpha) < 0.001) {
      this.alpha = this.targetAlpha
    }

    this.draw()
    this.animFrameId = requestAnimationFrame(this.loop)
  }

  private draw(): void {
    if (this.alpha < 0.01 && this.targetAlpha === 0) return

    const ctx = this.ctx
    const w = this.canvas.width / (window.devicePixelRatio || 1)
    const h = this.canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.globalAlpha = this.alpha

    const petSize = Math.min(w, h - 30)
    const petTop = (h - petSize - 20) / 2

    // 气泡位置：角色头顶
    const bubbleCX = w / 2 + petSize * 0.15
    const bubbleCY = petTop + petSize * 0.08
    const bubbleW = Math.min(this.text.length * 11 + 36, w - 20)
    const bubbleH = 38

    this.drawComicBubble(ctx, bubbleCX, bubbleCY, bubbleW, bubbleH)

    ctx.restore()
  }

  private drawComicBubble(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, w: number, h: number
  ): void {
    if (!this.text) return

    const x = cx - w / 2
    const y = cy - h

    // ── 阴影 ──
    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3

    // ── 主体 (不规则圆角矩形，漫画风) ──
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'

    const r = 14
    ctx.beginPath()
    // 左上
    ctx.moveTo(x + r + 4, y)
    // 顶部（微拱）
    ctx.quadraticCurveTo(x + w * 0.3, y - 2, x + w * 0.55, y + 1)
    ctx.quadraticCurveTo(x + w * 0.8, y - 1, x + w - r, y)
    // 右上圆角
    ctx.arcTo(x + w, y, x + w, y + r, r)
    // 右
    ctx.lineTo(x + w, y + h - r)
    // 右下圆角
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)

    // 三角尾巴指向角色（在底部中间偏左）
    const tailX = x + w * 0.35
    ctx.lineTo(tailX + 14, y + h)
    ctx.lineTo(tailX + 7, y + h + 14)
    ctx.lineTo(tailX - 2, y + h)

    // 左下圆角
    ctx.arcTo(x, y + h, x, y + h - r, r)
    // 左
    ctx.lineTo(x, y + r)
    // 左上圆角
    ctx.arcTo(x, y, x + r, y, r)

    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // ── 高光线 ──
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + r + 6, y + 6)
    ctx.quadraticCurveTo(x + w * 0.3, y + 4, x + w - r - 4, y + 6)
    ctx.stroke()

    // ── 文字 ──
    ctx.fillStyle = '#222'
    ctx.font = 'bold 13px "Microsoft YaHei", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.text, cx, cy - h / 2)
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer)
    if (this.animTimer) clearTimeout(this.animTimer)
    cancelAnimationFrame(this.animFrameId)
    if (this.observer) { this.observer.disconnect(); this.observer = null }
    this.canvas.remove()
  }
}
