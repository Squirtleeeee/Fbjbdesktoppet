import type { PetState } from '../engine/state-machine'
import type { SpriteRect } from '../engine/canvas-renderer'
import { getRandomPhrase } from '../utils/speech'

export class SpeechBubble {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private timer: ReturnType<typeof setTimeout> | null = null
  private alpha = 0
  private targetAlpha = 0
  private text = ''
  private animFrameId = 0
  private observer: ResizeObserver | null = null
  private getPetRect: (() => SpriteRect) | null = null

  private readonly DISPLAY_DURATION = 2500

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

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(container)
    this.resize()
    this.loop()
  }

  setPetRectProvider(fn: () => SpriteRect): void {
    this.getPetRect = fn
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

    const rect = this.getPetRect?.() ?? {
      x: (w - 200) / 2,
      y: (h - 200) / 2,
      size: 200,
    }

    // 气泡在头顶正上方，尾巴指向头顶
    const headX = rect.x + rect.size * 0.5
    const headY = rect.y + rect.size * 0.14
    const bubbleW = Math.min(Math.max(this.text.length * 10 + 28, 72), rect.size * 1.1)
    const bubbleH = 34
    const bubbleBottom = headY - 4
    const bubbleCX = headX

    this.drawComicBubble(ctx, bubbleCX, bubbleBottom, bubbleW, bubbleH, headX, headY)

    ctx.restore()
  }

  private drawComicBubble(
    ctx: CanvasRenderingContext2D,
    cx: number,
    bottomY: number,
    w: number,
    h: number,
    tailTargetX: number,
    tailTargetY: number,
  ): void {
    if (!this.text) return

    const x = cx - w / 2
    const y = bottomY - h

    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 2

    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'

    const r = 10
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)

    // 尾巴指向头顶
    const tailBase = cx
    ctx.lineTo(tailBase + 8, y + h)
    ctx.lineTo(tailTargetX, tailTargetY)
    ctx.lineTo(tailBase - 8, y + h)

    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.fillStyle = '#222'
    ctx.font = 'bold 11px "Microsoft YaHei", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.text, cx, y + h / 2)
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer)
    cancelAnimationFrame(this.animFrameId)
    if (this.observer) { this.observer.disconnect(); this.observer = null }
    this.canvas.remove()
  }
}
