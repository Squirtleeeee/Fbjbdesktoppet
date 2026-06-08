import type { PetState } from './state-machine'

// 图片文件名映射
const SPRITE_MAP: Record<PetState, string[]> = {
  idle: [
    'PhoebeX_038.png',
    'PhoebeX_040.png',
    'PhoebeX_072.png',
    'PhoebeX_073.png',
    'PhoebeX_035.png',
    'PhoebeX_018.png',
  ],
  thinking: [
    'PhoebeX_027.png',
    'PhoebeX_028.png',
    'PhoebeX_029.png',
    'PhoebeX_101.png',
  ],
  working: [
    'PhoebeX_056.png',
    'PhoebeX_074.png',
    'PhoebeX_085.png',
    'PhoebeX_086.png',
  ],
  done: [
    'PhoebeX_026.png',
    'PhoebeX_002.png',
    'PhoebeX_007.png',
  ],
  waiting_auth: [
    'PhoebeX_010.png',
    'PhoebeX_021.png',
    'PhoebeX_022.png',
    'PhoebeX_037.png',
    'PhoebeX_075.png',
  ],
}

const SPRITE_BASE = 'sprites'

export class SpriteManager {
  private sprites: Map<PetState, HTMLImageElement[]> = new Map()
  private loaded = false

  get isLoaded(): boolean {
    return this.loaded
  }

  async loadAll(): Promise<void> {
    const entries = Object.entries(SPRITE_MAP) as [PetState, string[]][]
    const promises = entries.map(async ([state, files]) => {
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
