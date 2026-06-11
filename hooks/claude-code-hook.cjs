#!/usr/bin/env node
/**
 * Claude Code Hook — 桌宠状态上报（菲比啾比~）
 *
 * 配置方式（在 .claude/settings.json 中）：
 * {
 *   "hooks": {
 *     "PostToolUse": [
 *       { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "post_tool"] }
 *     ],
 *     "Stop": [
 *       { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "stop"] }
 *     ],
 *     "PreToolUse": [
 *       { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "pre_tool"] }
 *     ],
 *     "UserPromptSubmit": [
 *       { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "user_prompt"] }
 *     ],
 *     "SessionStart": [
 *       { "command": "node", "args": ["<项目路径>/hooks/claude-code-hook.cjs", "session_start"] }
 *     ]
 *   }
 * }
 */

const fs = require('fs')
const http = require('http')
const path = require('path')

const WS_URL = process.env.PET_WS_URL || 'http://127.0.0.1:9527'

function parseStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve(null)
      }
    })
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read()
      if (chunk) data += chunk
    })
    setTimeout(() => {
      try {
        resolve(data ? JSON.parse(data) : null)
      } catch {
        resolve(null)
      }
    }, 200)
  })
}

function sendEvent(data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data)
    const url = new URL(WS_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(options, (res) => {
      res.resume()
      resolve()
    })
    req.on('error', () => resolve())
    req.setTimeout(2000, () => {
      req.destroy()
      resolve()
    })
    req.write(body)
    req.end()
  })
}

function extractProjectKey(hookData) {
  if (!hookData) return 'default'
  if (hookData.cwd) return hookData.cwd
  if (hookData.project_dir) return hookData.project_dir
  if (hookData.transcript_path) return path.dirname(hookData.transcript_path)
  return 'default'
}

function toolToState(toolName) {
  switch (toolName) {
    case 'Think':
      return 'thinking'
    case 'AskUserQuestion':
    case 'AskQuestion':
      return 'waiting_auth'
    case 'Write':
    case 'Edit':
    case 'StrReplace':
    case 'Delete':
    case 'Bash':
    case 'Shell':
    case 'Glob':
    case 'Grep':
    case 'Read':
    case 'WebFetch':
    case 'WebSearch':
    case 'Task':
    case 'TodoWrite':
    case 'GenerateImage':
    case 'SwitchMode':
    case 'NotebookEdit':
      return 'working'
    default:
      return null
  }
}

function parseTranscriptUsage(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null

  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
  let input = 0
  let output = 0
  let cacheRead = 0
  let cacheCreate = 0
  const messages = transcript.messages || []
  for (const msg of messages) {
    const usage = msg.usage || msg.message?.usage || {}
    input += usage.input_tokens || 0
    output += usage.output_tokens || 0
    cacheRead += usage.cache_read_input_tokens || 0
    cacheCreate += usage.cache_creation_input_tokens || 0
  }
  if (input === 0 && output === 0) return null
  return { input, output, cacheRead, cacheCreate, total: input + output }
}

async function sendTokenUpdate(hookData, finalize = false) {
  try {
    const transcriptPath = hookData?.transcript_path
    const usage = parseTranscriptUsage(transcriptPath)
    if (!usage) return

    await sendEvent({
      type: 'token_update',
      tokens: usage,
      projectKey: extractProjectKey(hookData),
      transcriptKey: transcriptPath || '',
      finalize,
      source: 'claude-code',
    })
  } catch { /* ignore parse errors */ }
}

async function handlePostTool(hookData) {
  if (!hookData) return
  const toolName = hookData.tool_name
  const state = toolToState(toolName)

  if (state) {
    await sendEvent({ type: 'state_change', state })
  }

  if (toolName === 'TodoWrite') {
    try {
      const input = hookData.tool_input || {}
      const todos = input.todos || []
      const steps = todos.map((t) => ({
        content: t.content || t.activeForm || '',
        status: t.status,
      }))
      await sendEvent({
        type: 'workflow_update',
        steps,
        current: steps.findIndex((s) => s.status === 'in_progress'),
      })
    } catch { /* ignore parse errors */ }
  }

  await sendTokenUpdate(hookData, false)
}

async function handleStop(hookData) {
  await sendEvent({ type: 'state_change', state: 'done' })
  await sendTokenUpdate(hookData, true)
}

async function handlePreTool(hookData) {
  if (!hookData) return
  const toolName = hookData.tool_name
  if (toolName === 'AskUserQuestion' || toolName === 'AskQuestion') {
    await sendEvent({ type: 'state_change', state: 'waiting_auth' })
  }
}

async function handleUserPrompt() {
  await sendEvent({ type: 'state_change', state: 'working' })
}

async function handleSessionStart() {
  await sendEvent({ type: 'session_start' })
}

async function main() {
  const hookType = process.argv[2]
  const hookData = await parseStdin()

  switch (hookType) {
    case 'post_tool':
      await handlePostTool(hookData)
      break
    case 'stop':
      await handleStop(hookData)
      break
    case 'pre_tool':
      await handlePreTool(hookData)
      break
    case 'user_prompt':
      await handleUserPrompt()
      break
    case 'session_start':
      await handleSessionStart()
      break
    default:
      console.error('[phoebe-hook] unknown hook type:', hookType)
  }
}

main().catch(() => {})
