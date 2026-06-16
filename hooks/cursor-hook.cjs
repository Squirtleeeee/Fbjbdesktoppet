#!/usr/bin/env node
/**
 * Cursor Hook — 桌宠状态上报
 * 配置见 hooks/cursor-hooks.example.json
 */

const http = require('http')

const WS_URL = process.env.PET_WS_URL || 'http://127.0.0.1:9527'

function parseStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { resolve(null) }
    })
    setTimeout(() => {
      try { resolve(data ? JSON.parse(data) : null) } catch { resolve(null) }
    }, 300)
  })
}

function sendEvent(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload)
    const url = new URL(WS_URL)
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => { res.resume(); resolve() })
    req.on('error', () => resolve())
    req.setTimeout(1500, () => { req.destroy(); resolve() })
    req.write(body)
    req.end()
  })
}

function getToolName(data) {
  if (!data) return ''
  return data.tool_name || data.toolName || data.tool || data.tool_type || ''
}

function getToolInput(data) {
  if (!data) return {}
  return data.tool_input || data.toolInput || data.input || {}
}

function toolToState(toolName) {
  const name = String(toolName)
  if (/askquestion|askuserquestion/i.test(name)) return 'waiting_auth'
  if (!name) return null
  return 'working'
}

async function handlePostToolUse(data) {
  const toolName = getToolName(data)
  const state = toolToState(toolName)
  if (state) {
    await sendEvent({ type: 'state_change', state })
  }

  if (/todowrite/i.test(String(toolName))) {
    try {
      const input = getToolInput(data)
      const todos = input.todos || []
      const steps = todos.map((t) => ({
        content: t.content || t.activeForm || '',
        status: t.status,
      }))
      if (steps.length > 0) {
        await sendEvent({
          type: 'workflow_update',
          steps,
          current: steps.findIndex((s) => s.status === 'in_progress'),
        })
      }
    } catch { /* ignore */ }
  }
}

async function main() {
  const event = process.argv[2]
  const data = await parseStdin()

  switch (event) {
    case 'sessionStart':
      await sendEvent({ type: 'session_start' })
      break
    case 'beforeSubmitPrompt':
      await sendEvent({ type: 'state_change', state: 'working' })
      break
    case 'postToolUse':
      await handlePostToolUse(data)
      break
    case 'stop':
      await sendEvent({ type: 'state_change', state: 'done' })
      break
  }

  process.stdout.write('{}')
}

main().catch(() => { process.stdout.write('{}') })
