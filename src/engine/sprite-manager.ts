import type { PetState } from './state-machine'

// 每状态帧数（AI 生成动态帧）
const FRAME_COUNTS: Record<PetState, number> = {
  idle: 8,
  thinking: 8,
  working: 8,
  done: 8,
  waiting_auth: 8,
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
