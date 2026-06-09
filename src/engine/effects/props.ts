// 道具绘制：键盘、思考气泡、感叹号等

// 键盘绘制
export function drawKeyboard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pressedKeys: Set<number>,   // 当前按下的键索引
  glowAlpha: number
): void {
  const rows = 3
  const cols = 8
  const keyW = w / (cols + 0.5)
  const keyH = h / (rows + 0.5)
  const startX = x + keyW * 0.25
  const startY = y + keyH * 0.25
  const gap = 2

  // 键盘底座
  ctx.fillStyle = '#1a1a2e'
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 6)
  ctx.fill()
  ctx.stroke()

  for (let r = 0; r < rows; r++) {
    const rowCols = r === 2 ? cols - 2 : cols  // 底行少两键
    const offsetX = r === 2 ? keyW * 0.75 : (r === 1 ? keyW * 0.1 : 0)
    for (let c = 0; c < rowCols; c++) {
      const kx = startX + offsetX + c * (keyW + gap)
      const ky = startY + r * (keyH + gap)
      const idx = r * cols + c
      const pressed = pressedKeys.has(idx)

      // 键帽
      ctx.fillStyle = pressed ? '#4fc3f7' : '#2a2a3e'
      ctx.strokeStyle = pressed ? '#81d4fa' : '#444'
      ctx.lineWidth = 1
      roundRect(ctx, kx, ky, keyW, keyH, 3)
      ctx.fill()
      ctx.stroke()

      // 键帽高光
      if (pressed) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        roundRect(ctx, kx + 1, ky + 1, keyW - 2, keyH / 2, 2)
        ctx.fill()
      }
    }
  }

  // 屏幕荧光
  if (glowAlpha > 0) {
    const gradient = ctx.createLinearGradient(x, y - h, x, y)
    gradient.addColorStop(0, `rgba(79,195,247,${glowAlpha * 0.3})`)
    gradient.addColorStop(1, 'rgba(79,195,247,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(x - 4, y - h * 0.8, w + 8, h * 0.8)
  }
}

// 思考气泡
export function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  dots: number   // 显示几个点 (0-3)
): void {
  // 主体
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.strokeStyle = 'rgba(200,200,200,0.9)'
  ctx.lineWidth = 1.5
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 10)
  ctx.fill()
  ctx.stroke()

  // 下方三角形
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.moveTo(x - 10, y + h / 2)
  ctx.lineTo(x + 10, y + h / 2)
  ctx.lineTo(x, y + h / 2 + 12)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // 点
  const dotRadius = 5
  const totalDotsW = dots * (dotRadius * 3)
  const startDotX = x - totalDotsW / 2 + dotRadius
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < dots ? '#333' : '#ccc'
    ctx.beginPath()
    ctx.arc(startDotX + i * dotRadius * 3, y, dotRadius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 感叹号气泡
export function drawExclaimBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, alpha: number
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ff5252'
  ctx.font = `bold ${size}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', x, y)
  ctx.restore()
}

// 工作桌（简易办公桌场景）
export function drawDesk(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): void {
  // 桌面
  ctx.fillStyle = '#5d4037'
  roundRect(ctx, x, y, w, h, 4)
  ctx.fill()

  // 桌腿
  ctx.fillStyle = '#4e342e'
  const legW = 6
  ctx.fillRect(x + 4, y + h, legW, h * 0.6)
  ctx.fillRect(x + w - 4 - legW, y + h, legW, h * 0.6)

  // 屏幕
  const screenW = w * 0.5
  const screenH = h * 0.7
  ctx.fillStyle = '#263238'
  ctx.strokeStyle = '#37474f'
  ctx.lineWidth = 2
  roundRect(ctx, x + (w - screenW) / 2, y - screenH + 2, screenW, screenH, 3)
  ctx.fill()
  ctx.stroke()

  // 屏幕内容（代码行）
  ctx.fillStyle = '#4fc3f7'
  const lineY = y - screenH + 10
  for (let i = 0; i < 3; i++) {
    const len = 8 + Math.random() * 20
    ctx.fillRect(x + (w - screenW) / 2 + 5, lineY + i * 8, len, 2)
  }
}

// 辅助：圆角矩形
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
