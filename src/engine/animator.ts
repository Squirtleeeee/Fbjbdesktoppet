import type { PetState } from './state-machine'

export type LoopMode = 'loop' | 'pingpong' | 'once'

export interface AnimConfig {
  fps: number
  loopMode: LoopMode
}

// idle 8 原生帧；其余 4 关键帧。不做 crossfade / 插值（避免叠影与彩色频闪）
export const ANIM_CONFIGS: Record<PetState, AnimConfig> = {
  idle: { fps: 6, loopMode: 'pingpong' },
  thinking: { fps: 4, loopMode: 'loop' },
  working: { fps: 5, loopMode: 'loop' },
  done: { fps: 5, loopMode: 'once' },
  waiting_auth: { fps: 4, loopMode: 'loop' },
}

export class Animator {
  private frameIndex = 0
  private elapsed = 0
  private pingpongForward = true
  private finished = false

  constructor(private config: AnimConfig, private frameCount: number) {}

  get currentFrame(): number {
    return this.frameIndex
  }

  get isFinished(): boolean {
    return this.finished
  }

  update(dt: number): void {
    if (this.finished) return
    if (this.frameCount === 0) return

    const frameDuration = 1000 / this.config.fps
    this.elapsed += dt

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration
      this.advanceFrame()
    }
  }

  private advanceFrame(): void {
    switch (this.config.loopMode) {
      case 'loop':
        this.frameIndex = (this.frameIndex + 1) % this.frameCount
        break

      case 'pingpong':
        if (this.pingpongForward) {
          this.frameIndex++
          if (this.frameIndex >= this.frameCount - 1) {
            this.frameIndex = this.frameCount - 1
            this.pingpongForward = false
          }
        } else {
          this.frameIndex--
          if (this.frameIndex <= 0) {
            this.frameIndex = 0
            this.pingpongForward = true
          }
        }
        break

      case 'once':
        if (this.frameIndex < this.frameCount - 1) {
          this.frameIndex++
        } else {
          this.finished = true
        }
        break
    }
  }

  reset(config?: AnimConfig, frameCount?: number): void {
    if (config) this.config = config
    if (frameCount !== undefined) this.frameCount = frameCount
    this.frameIndex = 0
    this.elapsed = 0
    this.pingpongForward = true
    this.finished = false
  }
}
