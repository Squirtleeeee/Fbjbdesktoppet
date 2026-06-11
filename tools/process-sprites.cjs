#!/usr/bin/env node
// 绿幕抠图 + 居中方形裁剪，把 raw-phoebe 生成图转换为 sprites 帧
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const RAW_DIR = path.join(__dirname, '../art/raw-phoebe')
const OUT_BASE = path.join(__dirname, '../assets/sprites')

// raw 文件名前缀 → 状态目录
const STATE_MAP = {
  idle: 'idle',
  thinking: 'thinking',
  working: 'working',
  done: 'done',
  waiting: 'waiting_auth',
}

function chromaKey(png) {
  const { width, height, data } = png
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    const greenness = g - Math.max(r, b)

    if (greenness > 90) {
      data[idx + 3] = 0
    } else if (greenness > 30) {
      // 边缘半透明 + 去绿色溢出
      const t = (greenness - 30) / 60
      data[idx + 3] = Math.round(255 * (1 - t))
      data[idx + 1] = Math.max(r, b)
    }
  }
}

function cropCenterSquare(png) {
  const { width, height } = png
  const size = Math.min(width, height)
  const x0 = Math.floor((width - size) / 2)
  const y0 = Math.floor((height - size) / 2)
  const out = new PNG({ width: size, height: size })
  PNG.bitblt(png, out, x0, y0, size, size, 0, 0)
  return out
}

function processFile(rawName, state, frameIndex) {
  const input = PNG.sync.read(fs.readFileSync(path.join(RAW_DIR, rawName)))
  chromaKey(input)
  const square = cropCenterSquare(input)

  const outDir = path.join(OUT_BASE, state)
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `frame_${String(frameIndex).padStart(2, '0')}.png`)
  fs.writeFileSync(outPath, PNG.sync.write(square))
  console.log(`${rawName} -> ${path.relative(process.cwd(), outPath)}`)
}

function main() {
  // 清空旧帧（小狗帧已备份到 sprites-dog）
  for (const state of Object.values(STATE_MAP)) {
    const dir = path.join(OUT_BASE, state)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => /^phoebe-\w+-\d+\.png$/.test(f))
  for (const f of files) {
    const m = f.match(/^phoebe-(\w+)-(\d+)\.png$/)
    if (!m) continue
    const state = STATE_MAP[m[1]]
    if (!state) continue
    processFile(f, state, Number(m[2]))
  }
  console.log('done')
}

main()
