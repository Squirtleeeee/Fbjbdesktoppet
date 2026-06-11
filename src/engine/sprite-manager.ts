import type { PetState } from './state-machine'

// idle 有 8 张原生 AI 帧；其余状态 4 关键帧。不做像素插值扩展（工作状态插值会产生彩色叠影）
const FRAME_COUNTS: Record<PetState, number> = {
  idle: 8,
  thinking: 4,
  working: 4,
  done: 4,
  waiting_auth: 4,
}

const SPRITE_BASE = 'sprites'

export class SpriteManager {
  private sprites: Map<PetState, HTMLImageElement[]> = new Map()
  private loaded = false

  get isLoaded(): boolean {
    return this.loaded
  }

  getFrameCount(state: PetState): number {
    return FRAME_COUNTS[state]
  }

  async loadAll(): Promise<void> {
    const states: PetState[] = ['idle', 'thinking', 'working', 'done', 'waiting_auth']
    const promises = states.map(async (state) => {
      const count = FRAME_COUNTS[state]
      const files = Array.from({ length: count }, (_, i) =>
        `frame_${String(i).padStart(2, '0')}.png`
      )
      const images = await Promise.all(
        files.map(f => this.loadImage(`${SPRITE_BASE}/${state}/${f}`))
      )
      this.sprites.set(state, images)
    })
    await Promise.all(promises)
    this.loaded = true
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${src}`))
      img.src = src
    })
  }

  getFrames(state: PetState): HTMLImageElement[] {
    const frames = this.sprites.get(state)
    if (!frames) throw new Error(`Sprites not loaded for state: ${state}`)
    return frames
  }
}
