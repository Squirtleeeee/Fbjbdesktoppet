#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const releaseDir = path.join(root, 'release')
const unpackedDir = path.join(releaseDir, 'win-unpacked')
const stagingDir = path.join(releaseDir, 'package')
const outZip = path.join(releaseDir, '菲比桌宠-win.zip')

if (!fs.existsSync(unpackedDir)) {
  console.error('win-unpacked/ not found — run npm run dist first')
  process.exit(1)
}

const portableExe = fs.readdirSync(releaseDir).find(f => f.endsWith('.exe') && !f.includes('uninstall'))
if (!portableExe) {
  console.error('portable exe not found in release/')
  process.exit(1)
}

if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true })
fs.mkdirSync(stagingDir, { recursive: true })

fs.copyFileSync(path.join(releaseDir, portableExe), path.join(stagingDir, portableExe))

for (const name of ['hooks', '使用说明.txt', '启动菲比.bat']) {
  const src = path.join(unpackedDir, name)
  const dest = path.join(stagingDir, name)
  if (!fs.existsSync(src)) {
    console.error('missing in win-unpacked:', name)
    process.exit(1)
  }
  if (fs.statSync(src).isDirectory()) {
    fs.cpSync(src, dest, { recursive: true })
  } else {
    fs.copyFileSync(src, dest)
  }
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip)

const items = fs.readdirSync(stagingDir)
execSync(
  `tar -a -cf "${outZip}" ${items.map(f => `"${f}"`).join(' ')}`,
  { cwd: stagingDir, stdio: 'inherit' }
)

fs.rmSync(stagingDir, { recursive: true, force: true })
console.log('created', outZip, `(${items.join(', ')})`)
