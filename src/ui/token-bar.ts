export interface TokenData {
  input: number
  output: number
  cacheRead: number
  cacheCreate: number
  total: number
}

export class TokenBar {
  private el: HTMLDivElement
  private barEl: HTMLDivElement
  private labelEl: HTMLDivElement
  private data: TokenData | null = null

  constructor(container: HTMLElement) {
    this.el = document.createElement('div')
    Object.assign(this.el.style, {
      position: 'absolute',
      bottom: '4px',
      left: '8px',
      right: '8px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'system-ui, monospace',
      fontSize: '10px',
      color: '#ccc',
      zIndex: '5',
    })

    this.barEl = document.createElement('div')
    Object.assign(this.barEl.style, {
      flex: '1',
      height: '6px',
      borderRadius: '3px',
      background: 'rgba(255,255,255,0.15)',
      position: 'relative',
      overflow: 'hidden',
    })

    this.labelEl = document.createElement('div')
    this.labelEl.style.whiteSpace = 'nowrap'
    this.labelEl.textContent = '--'

    this.el.appendChild(this.barEl)
    this.el.appendChild(this.labelEl)
    container.appendChild(this.el)
  }

  update(data: TokenData): void {
    this.data = data

    // 格式化数字
    const fmt = (n: number) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
      if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
      return String(n)
    }

    const cacheRate = data.total > 0
      ? Math.round(((data.cacheRead + data.cacheCreate) / data.total) * 100)
      : 0

    this.labelEl.textContent = `${fmt(data.total)} | 🧠${cacheRate}%`

    // 进度条分段: input(蓝) / output(绿) / cache(金)
    const total = data.input + data.output + data.cacheRead + data.cacheCreate || 1
    const inputPct = (data.input / total) * 100
    const outputPct = (data.output / total) * 100
    const cachePct = ((data.cacheRead + data.cacheCreate) / total) * 100

    this.barEl.innerHTML = `
      <span style="position:absolute;left:0;top:0;bottom:0;width:${inputPct}%;background:rgba(66,165,245,0.7);border-radius:3px 0 0 3px;"></span>
      <span style="position:absolute;left:${inputPct}%;top:0;bottom:0;width:${outputPct}%;background:rgba(102,187,106,0.7);"></span>
      <span style="position:absolute;left:${inputPct + outputPct}%;top:0;bottom:0;width:${cachePct}%;background:rgba(255,193,7,0.7);border-radius:0 3px 3px 0;"></span>
    `
  }

  destroy(): void {
    this.el.remove()
  }
}
