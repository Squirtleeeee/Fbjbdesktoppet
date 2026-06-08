export interface WorkflowStep {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
}

export class WorkflowPanel {
  private el: HTMLDivElement
  private visible = false

  constructor(container: HTMLElement) {
    this.el = document.createElement('div')
    Object.assign(this.el.style, {
      position: 'absolute',
      right: '-210px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '200px',
      maxHeight: '160px',
      overflowY: 'auto',
      background: 'rgba(20,20,40,0.9)',
      borderRadius: '8px',
      padding: '8px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ccc',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      zIndex: '8',
    })
    container.appendChild(this.el)
  }

  update(steps: WorkflowStep[]): void {
    if (steps.length === 0) {
      this.el.innerHTML = '<div style="color:#888;text-align:center;">等待任务...</div>'
      return
    }

    this.el.innerHTML = steps.map((s, i) => {
      let icon = '○'
      let color = '#666'
      if (s.status === 'in_progress') {
        icon = '▶'
        color = '#4fc3f7'
      } else if (s.status === 'completed') {
        icon = '✓'
        color = '#81c784'
      }

      const content = s.content.length > 28
        ? s.content.slice(0, 28) + '…'
        : s.content

      return `<div style="display:flex;gap:6px;align-items:flex-start;padding:3px 0;color:${color};">
        <span style="flex-shrink:0;">${icon}</span>
        <span>${content}</span>
      </div>`
    }).join('')
  }

  show(): void {
    this.visible = true
    this.el.style.opacity = '1'
  }

  hide(): void {
    this.visible = false
    this.el.style.opacity = '0'
  }

  destroy(): void {
    this.el.remove()
  }
}
