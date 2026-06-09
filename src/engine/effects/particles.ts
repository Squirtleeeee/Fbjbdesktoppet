// 粒子特效系统

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number       // 剩余生命 ms
  maxLife: number     // 总生命 ms
  size: number
  char: string        // 显示的字符 (?, !, ★, ● 等)
  color: string
  rotation: number
  rotSpeed: number
}

export interface EmitterConfig {
  spawnRate: number      // 每秒生成几个
  chars: string[]         // 随机选取的字符
  colors: string[]        // 随机选取的颜色
  minSize: number
  maxSize: number
  minLife: number
  maxLife: number
  speedX: number          // X 速度范围 ±
  speedY: number          // Y 速度范围 (负=向上)
  gravity: number         // Y 加速度
}

export class ParticleSystem {
  particles: Particle[] = []
  private timer = 0
  private spawnAccum = 0

  constructor(private config: EmitterConfig) {}

  update(dt: number): void {
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt / 1000
      p.y += p.vy * dt / 1000
      p.vy += this.config.gravity * dt / 1000
      p.rotation += p.rotSpeed * dt / 1000
      p.life -= dt
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }

    // 生成新粒子
    this.spawnAccum += dt
    const interval = 1000 / this.config.spawnRate
    while (this.spawnAccum >= interval) {
      this.spawnAccum -= interval
      this.spawn()
    }

    this.timer += dt
  }

  private spawn(): void {
    const cfg = this.config
    this.particles.push({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * cfg.speedX * 2,
      vy: -Math.random() * cfg.speedY,
      life: cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife),
      maxLife: cfg.maxLife,
      size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
      char: cfg.chars[Math.floor(Math.random() * cfg.chars.length)],
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
    })
  }

  draw(ctx: CanvasRenderingContext2D, originX: number, originY: number): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(originX + p.x, originY + p.y)
      ctx.rotate(p.rotation)
      ctx.font = `${p.size}px system-ui, sans-serif`
      ctx.fillStyle = p.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(p.char, 0, 0)
      ctx.restore()
    }
  }

  reset(): void {
    this.particles = []
    this.spawnAccum = 0
    this.timer = 0
  }
}

// 预设 emitter 配置
export const EMITTERS = {
  // 思考：? 号上浮
  thinking: (): EmitterConfig => ({
    spawnRate: 1.2,
    chars: ['?', '?', '···'],
    colors: ['#ff9800', '#ffb74d', '#ffcc02'],
    minSize: 14,
    maxSize: 22,
    minLife: 1500,
    maxLife: 2800,
    speedX: 15,
    speedY: 40,
    gravity: -5,
  }),

  // 完成：星星爆发
  done: (): EmitterConfig => ({
    spawnRate: 8,
    chars: ['★', '✨', '⭐', '🎉', '✓'],
    colors: ['#ffd700', '#ff6b6b', '#4fc3f7', '#69f0ae', '#ff80ab'],
    minSize: 10,
    maxSize: 24,
    minLife: 600,
    maxLife: 1500,
    speedX: 80,
    speedY: 100,
    gravity: 50,
  }),

  // 等待授权：! 号弹跳
  waiting: (): EmitterConfig => ({
    spawnRate: 2,
    chars: ['!', '!', '❓'],
    colors: ['#ff5252', '#ff1744', '#ff8a80'],
    minSize: 16,
    maxSize: 26,
    minLife: 800,
    maxLife: 1800,
    speedX: 5,
    speedY: 60,
    gravity: -15,
  }),

  // 工作中：代码/汗滴
  working: (): EmitterConfig => ({
    spawnRate: 1.5,
    chars: ['💧', '⚙', '{}', '<>'],
    colors: ['#4fc3f7', '#81d4fa', '#90caf9'],
    minSize: 8,
    maxSize: 14,
    minLife: 1000,
    maxLife: 2000,
    speedX: 8,
    speedY: 30,
    gravity: 20,
  }),
}
