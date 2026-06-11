#!/usr/bin/env node
// [已弃用] 像素插值 4→8 帧会在工作状态产生彩色叠影频闪。
// 请只用 process-sprites.cjs；idle 原生 8 帧，其余状态 4 关键帧即可。
console.warn('expand-sprite-frames.cjs is deprecated — use npm run sprites:process only')
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const SPRITES_DIR = path.join(__dirname, '../assets/sprites')
const STATES = ['idle', 'thinking', 'working', 'done', 'waiting_auth']

function blend(a, b, t) {
  const out = new PNG({ width: a.width, height: a.height })
  for (let i = 0; i < a.data.length; i += 4) {
    const alpha = a.data[i + 3] / 255 * (1 - t) + b.data[i + 3] / 255 * t
    if (alpha < 0.01) {
      out.data[i + 3] = 0
      continue
    }
    for (let c = 0; c < 3; c++) {
      const va = a.data[i + c] * (a.data[i + 3] / 255)
      const vb = b.data[i + c] * (b.data[i + 3] / 255)
      out.data[i + c] = Math.round((va * (1 - t) + vb * t) / alpha * 255)
    }
    out.data[i + 3] = Math.round(alpha * 255)
  }
  return out
}

function loadFrames(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => /^frame_\d+\.png$/.test(f))
    .sort()
  return files.map(f => PNG.sync.read(fs.readFileSync(path.join(dir, f))))
}

function expandFourToEight(frames, loop) {
  const [f0, f1, f2, f3] = frames
  const mid = (a, b) => blend(a, b, 0.5)
  if (loop) {
    return [f0, mid(f0, f1), f1, mid(f1, f2), f2, mid(f2, f3), f3, mid(f3, f0)]
  }
  return [f0, mid(f0, f1), f1, mid(f1, f2), f2, mid(f2, f3), f3, mid(f2, f3)]
}

function main() {
  for (const state of STATES) {
    const dir = path.join(SPRITES_DIR, state)
    if (!fs.existsSync(dir)) continue

    const frames = loadFrames(dir)
    if (frames.length === 8) {
      console.log(`${state}: already 8 frames, skip`)
      continue
    }
    if (frames.length !== 4) {
      console.log(`${state}: expected 4 or 8 frames, got ${frames.length}, skip`)
      continue
    }

    const loop = state !== 'done'
    const expanded = expandFourToEight(frames, loop)
    for (let i = 0; i < expanded.length; i++) {
      const outPath = path.join(dir, `frame_${String(i).padStart(2, '0')}.png`)
      fs.writeFileSync(outPath, PNG.sync.write(expanded[i]))
    }
    console.log(`${state}: 4 -> 8 frames`)
  }
  console.log('done')
}

main()
