import type { SpriteRect } from '../engine/canvas-renderer'

export interface WorkflowStep {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
}

const PANEL_W = 108
const PANEL_MAX_H = 88
const GAP = 6

export class WorkflowPanel {
  private el: HTMLDivElement
  private bodyEl: HTMLDivElement
  private visible = false
  private steps: WorkflowStep[] = []
  private currentIndex = -1
  private getPetRect: (() => SpriteRect) | null = null

  constructor(container: HTMLElement) {
    this.el = document.createElement('div')
    Object.assign(this.el.style, {
      position: 'absolute',
      width: `${PANEL_W}px`,
      maxHeight: `${PANEL_MAX_H}px`,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(16,16,32,0.94)',
      border: '1px solid rgba(79,195,247,0.35)',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      color: '#ccc',
      opacity: '0',
      visibility: 'hidden',
      transition: 'opacity 0.25s ease, visibility 0.25s ease',
      pointerEvents: 'none',
      zIndex: '9',
      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
    })

    const header = document.createElement('div')
    Object.assign(header.style, {
      padding: '4px 6px',
      fontSize: '10px',
      fontWeight: '600',
      color: '#4fc3f7',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: '0',
    })
    header.textContent = '📋 工作流'

    this.bodyEl = document.createElement('div')
    Object.assign(this.bodyEl.style, {
      padding: '4px 6px',
      overflowY: 'auto',
      flex: '1',
    })

    this.el.appendChild(header)
    this.el.appendChild(this.bodyEl)
    container.appendChild(this.el)
    this.renderBody()
  }

  setPetRectProvider(fn: () => SpriteRect): void {
    this.getPetRect = fn
  }

  /** 贴在桌宠左侧，不遮挡精灵 */
  layout(): void {
    if (!this.getPetRect) return
    const rect = this.getPetRect()
    const left = Math.max(4, rect.x - PANEL_W - GAP)
    const top = rect.y + rect.size * 0.08
    this.el.style.left = `${left}px`
    this.el.style.top = `${top}px`
    this.el.style.right = 'auto'
  }

  update(steps: WorkflowStep[], currentIndex = -1): void {
    this.steps = steps
    this.currentIndex = currentIndex
    this.renderBody()
  }

  private renderBody(): void {
    if (this.steps.length === 0) {
      this.bodyEl.innerHTML =
        '<div style="color:#888;text-align:center;padding:8px 2px;line-height:1.45;font-size:9px;">暂时没有工作流</div>'
      return
    }

    this.bodyEl.innerHTML = this.steps.map((s, i) => {
      const isCurrent = i === this.currentIndex || (this.currentIndex < 0 && s.status === 'in_progress')
      let icon = '○'
      let color = '#888'
      if (s.status === 'in_progress' || isCurrent) {
        icon = '▶'
        color = '#4fc3f7'
      } else if (s.status === 'completed') {
        icon = '✓'
        color = '#81c784'
      }

      const content = s.content.length > 22
        ? s.content.slice(0, 22) + '…'
        : s.content

      const weight = isCurrent ? '600' : '400'

      return `<div style="display:flex;gap:4px;align-items:flex-start;padding:2px 0;color:${color};font-weight:${weight};">
        <span style="flex-shrink:0;width:10px;">${icon}</span>
        <span style="line-height:1.3;">${content}</span>
      </div>`
    }).join('')
  }

  show(): void {
    this.layout()
    this.visible = true
    this.el.style.opacity = '1'
    this.el.style.visibility = 'visible'
    this.renderBody()
  }

  hide(): void {
    this.visible = false
    this.el.style.opacity = '0'
    this.el.style.visibility = 'hidden'
  }

  toggle(): boolean {
    if (this.visible) {
      this.hide()
      return false
    }
    this.show()
    return true
  }

  isVisible(): boolean {
    return this.visible
  }

  hasSteps(): boolean {
    return this.steps.length > 0
  }

  destroy(): void {
    this.el.remove()
  }
}
