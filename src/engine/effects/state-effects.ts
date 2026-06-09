// 每状态特效编排：角色动画 + 粒子 + 道具

import type { PetState } from '../state-machine'
import { ParticleSystem, EMITTERS } from './particles'
import { drawKeyboard, drawThoughtBubble, drawExclaimBubble } from './props'

export interface CharacterTransform {
  offsetX: number
  offsetY: number
  rotation: number     // 弧度
  scaleX: number
  scaleY: number
  alpha: number
  flipH: boolean
}

export interface EffectState {
  // 每帧生成角色变换
  getTransform(elapsed: number, dt: number): CharacterTransform
  // 更新粒子/道具
  update(dt: number): void
  // 绘制道具 overlays（键盘、气泡等）
  drawProps(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, petSize: number): void
  // 绘制粒子
  drawParticles(ctx: CanvasRenderingContext2D, centerX: number, petTop: number): void
  // 重置
  reset(): void
}

const DEFAULT_TRANSFORM: CharacterTransform = {
  offsetX: 0, offsetY: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, flipH: false,
}

// ──── 待机 Idle ────
function createIdleEffect(): EffectState {
  let blinkTimer = 0
  let blinkAlpha = 1
  const blinkInterval = 2500 + Math.random() * 2000

  return {
    getTransform(elapsed) {
      // 呼吸式 Y 轴浮动
      const bobY = Math.sin(elapsed / 1200) * 3
      // 头微微侧
      const tilt = Math.sin(elapsed / 1800) * 0.03
      // 眨眼
      blinkTimer += 16
      if (blinkTimer > blinkInterval && blinkTimer < blinkInterval + 150) {
        blinkAlpha = 0.3
      } else if (blinkTimer > blinkInterval + 150) {
        blinkAlpha = 1
        if (blinkTimer > blinkInterval + 2000) blinkTimer = 0
      }
      return { ...DEFAULT_TRANSFORM, offsetY: bobY, rotation: tilt, scaleY: blinkAlpha }
    },
    update() {},
    drawProps() {},
    drawParticles() {},
    reset() {},
  }
}

// ──── 思考 Thinking ────
function createThinkingEffect(): EffectState {
  const particles = new ParticleSystem(EMITTERS.thinking())
  let dotPhase = 0
  let dotTimer = 0

  return {
    getTransform(elapsed) {
      const tilt = Math.sin(elapsed / 1000) * 0.08 // 头歪
      return { ...DEFAULT_TRANSFORM, rotation: tilt, offsetY: Math.sin(elapsed / 1400) * 2 }
    },
    update(dt) {
      particles.update(dt)
      dotTimer += dt
    },
    drawProps(ctx, cx, cy, petSize) {
      // 思考气泡（头顶）
      const bubbleX = cx + petSize * 0.25
      const bubbleY = cy - petSize * 0.15
      dotPhase = Math.floor(dotTimer / 500) % 4  // 0,1,2,3 循环
      drawThoughtBubble(ctx, bubbleX, bubbleY, petSize * 0.38, petSize * 0.18, Math.min(dotPhase, 3))
    },
    drawParticles(ctx, cx, topY) {
      particles.draw(ctx, cx + 10, topY - 5)
    },
    reset() { particles.reset(); dotTimer = 0 },
  }
}

// ──── 工作中 Working ────
function createWorkingEffect(): EffectState {
  const particles = new ParticleSystem(EMITTERS.working())
  const pressedKeys = new Set<number>()
  let keyTimer = 0
  let keyCycle = 0

  return {
    getTransform(elapsed) {
      // 微小振动 + 略前倾
      const vibrate = Math.sin(elapsed / 50) * 1
      return {
        ...DEFAULT_TRANSFORM,
        offsetY: vibrate,
        offsetX: Math.sin(elapsed / 80) * 0.5,
        scaleX: 0.97, // 前倾压缩
      }
    },
    update(dt) {
      particles.update(dt)
      // 键盘打字动画
      keyTimer += dt
      if (keyTimer > 80) {
        keyTimer = 0
        keyCycle++
        pressedKeys.clear()
        // 随机按 2-4 个键
        const count = 2 + Math.floor(Math.random() * 3)
        for (let i = 0; i < count; i++) {
          pressedKeys.add(Math.floor(Math.random() * 24))
        }
      }
    },
    drawProps(ctx, cx, cy, petSize) {
      // 键盘在角色下方
      const kw = petSize * 0.7
      const kh = petSize * 0.25
      const kx = cx - kw / 2
      const ky = cy + petSize * 0.32
      drawKeyboard(ctx, kx, ky, kw, kh, pressedKeys, 0.5 + Math.sin(keyCycle * 0.1) * 0.3)
    },
    drawParticles(ctx, cx, topY) {
      particles.draw(ctx, cx + petSize * 0.3, cy + petSize * 0.1)
    },
    reset() { particles.reset(); keyTimer = 0; keyCycle = 0 },
  }
}

// ──── 完成 Done ────
function createDoneEffect(): EffectState {
  const particles = new ParticleSystem(EMITTERS.done())
  let jumpPhase = 0  // 0=settle, 1=jumping up, 2=peak, 3=landing
  let phaseTimer = 0

  return {
    getTransform(elapsed) {
      // 跳跃动画：前 300ms 起跳，300-500ms 峰值，500-800ms 回落
      if (elapsed < 100) {
        jumpPhase = 0
      } else if (elapsed < 400) {
        jumpPhase = 1
      } else if (elapsed < 600) {
        jumpPhase = 2
      } else if (elapsed < 900) {
        jumpPhase = 3
      } else {
        jumpPhase = 0
      }

      let offsetY = 0
      let scale = 1
      if (jumpPhase === 1) {
        const t = (elapsed - 100) / 300
        offsetY = -t * 25  // 上升
        scale = 1 + t * 0.1
      } else if (jumpPhase === 2) {
        offsetY = -25  // 峰值
        scale = 1.1
      } else if (jumpPhase === 3) {
        const t = (elapsed - 600) / 300
        offsetY = -25 + t * 25  // 回落
        scale = 1.1 - t * 0.1
      }

      return { ...DEFAULT_TRANSFORM, offsetY, scaleX: scale, scaleY: scale }
    },
    update(dt) {
      particles.update(dt)
      phaseTimer += dt
    },
    drawProps() {},
    drawParticles(ctx, cx, topY) {
      particles.draw(ctx, cx, topY)
    },
    reset() { particles.reset(); phaseTimer = 0 },
  }
}

// ──── 等待授权 Waiting Auth ────
function createWaitingEffect(): EffectState {
  const particles = new ParticleSystem(EMITTERS.waiting())
  let bouncePhase = 0

  return {
    getTransform(elapsed) {
      // 小幅度弹跳脉冲
      const pulse = 1 + Math.abs(Math.sin(elapsed / 600)) * 0.06
      const bounce = Math.abs(Math.sin(elapsed / 400)) * 5
      return {
        ...DEFAULT_TRANSFORM,
        offsetY: -bounce,
        scaleX: pulse,
        scaleY: pulse,
      }
    },
    update(dt) {
      particles.update(dt)
    },
    drawProps(ctx, cx, cy, petSize) {
      // 感叹号在头顶弹跳
      const bounceOffset = Math.abs(Math.sin(Date.now() / 300)) * 8
      drawExclaimBubble(ctx, cx + petSize * 0.25, cy - petSize * 0.25 + bounceOffset, petSize * 0.18, 0.9)
    },
    drawParticles(ctx, cx, topY) {
      particles.draw(ctx, cx, topY)
    },
    reset() { particles.reset() },
  }
}

// 工厂
export function createEffectForState(state: PetState): EffectState {
  switch (state) {
    case 'idle': return createIdleEffect()
    case 'thinking': return createThinkingEffect()
    case 'working': return createWorkingEffect()
    case 'done': return createDoneEffect()
    case 'waiting_auth': return createWaitingEffect()
  }
}
