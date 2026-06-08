import type { PetState } from '../engine/state-machine'
import { getRandomPhrase } from '../utils/speech'

export class SpeechBubble {
  private el: HTMLDivElement
  private timer: ReturnType<typeof setTimeout> | null = null
  private fadeTimer: ReturnType<typeof setTimeout> | null = null
  private readonly DISPLAY_DURATION = 2500
  private readonly FADE_DURATION = 400

  constructor(container: HTMLElement) {
    this.el = document.createElement('div')
    this.el.className = 'speech-bubble'
    Object.assign(this.el.style, {
      position: 'absolute',
      top: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.92)',
      color: '#333',
      padding: '6px 12px',
      borderRadius: '10px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: '0',
      transition: `opacity ${this.FADE_DURATION}ms ease`,
      fontFamily: 'system-ui, sans-serif',
      zIndex: '10',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    })
    container.appendChild(this.el)
  }

  showForState(state: PetState): void {
    const phrase = getRandomPhrase(state)
    this.show(phrase)
  }

  show(text: string): void {
    if (this.timer) clearTimeout(this.timer)
    if (this.fadeTimer) clearTimeout(this.fadeTimer)

    this.el.textContent = text
    this.el.style.opacity = '1'

    this.timer = setTimeout(() => {
      this.fadeOut()
    }, this.DISPLAY_DURATION)
  }

  private fadeOut(): void {
    this.el.style.opacity = '0'
    this.fadeTimer = setTimeout(() => {
      this.el.textContent = ''
    }, this.FADE_DURATION)
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer)
    if (this.fadeTimer) clearTimeout(this.fadeTimer)
    this.el.remove()
  }
}
