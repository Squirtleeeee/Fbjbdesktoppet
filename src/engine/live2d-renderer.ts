import type { PetState } from './state-machine'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import 'pixi-live2d-display/cubism2'  // 注册 Cubism 2.1 模型支持

// 状态 → 动作/表情映射
const STATE_CONFIG: Record<PetState, { motion: string; expression?: string }> = {
  idle:          { motion: 'idle',        expression: 'f01' },
  thinking:      { motion: 'flick_head',  expression: 'f03' },
  working:       { motion: 'tap_body',    expression: 'f02' },
  done:          { motion: 'pinch_out',   expression: 'f06' },
  waiting_auth:  { motion: 'shake',       expression: 'f04' },
}

export class Live2DRenderer {
  private app: PIXI.Application | null = null
  private model: Live2DModel | null = null
  private currentState: PetState = 'idle'
  private scale = 1

  constructor(private container: HTMLElement) {}

  async init(): Promise<void> {
    this.app = new PIXI.Application({
      width: this.container.clientWidth || 300,
      height: this.container.clientHeight || 400,
      transparent: true,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    const canvas = this.app.view as HTMLCanvasElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    this.container.appendChild(canvas)

    // 加载模型（自动检测 Cubism 2/4）
    this.model = await Live2DModel.from('live2d/haru/haru01.model.json')

    this.fitModel()
    this.app.stage.addChild(this.model)

    // 初始 idle
    this.playState('idle')

    // 响应窗口大小变化
    const observer = new ResizeObserver(() => this.resize())
    observer.observe(this.container)
  }

  private fitModel(): void {
    if (!this.model || !this.app) return

    const w = this.app.screen.width
    const h = this.app.screen.height
    const ratio = this.model.width / this.model.height

    let mw: number, mh: number
    if (ratio > w / h) {
      mw = w * 0.85
      mh = mw / ratio
    } else {
      mh = h * 0.85
      mw = mh * ratio
    }

    this.model.width = mw
    this.model.height = mh
    this.model.x = w / 2
    this.model.y = h / 2
    this.model.anchor.set(0.5)
  }

  setScale(scale: number): void {
    this.scale = scale
  }

  setState(state: PetState): void {
    if (state === this.currentState) return
    this.currentState = state
    this.playState(state)
  }

  private playState(state: PetState): void {
    if (!this.model) return

    const cfg = STATE_CONFIG[state]

    // 表情
    if (cfg.expression) {
      try {
        this.model.expression(cfg.expression)
      } catch { /* 忽略不存在的表情 */ }
    }

    // 动作
    try {
      this.model.motion(cfg.motion, undefined, { priority: 2 })
    } catch {
      // fallback idle
      if (cfg.motion !== 'idle') {
        try { this.model.motion('idle') } catch { /* */ }
      }
    }
  }

  resize(): void {
    if (!this.app) return
    const rect = this.container.getBoundingClientRect()
    this.app.renderer.resize(rect.width, rect.height)
    this.fitModel()
  }

  destroy(): void {
    this.model?.destroy()
    this.model = null
    this.app?.destroy(true, { children: true })
    this.app = null
  }
}
