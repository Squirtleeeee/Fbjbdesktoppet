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
 *     ]
 *   }
 * }
 */

const fs = require('fs')
const http = require('http')

const WS_URL = process.env.PET_WS_URL || 'http://127.0.0.1:9527'

// 解析 stdin 获取 hook 上下文（兼容 Windows 和 Unix）
function parseStdin() {
  return new Promise((resolve) => {
    // Claude Code hook 通过 stdin 传入 JSON
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
    // 如果 stdin 已经结束（pipe 模式），立刻触发
    process.stdin.on('readable', () => {
      const chunk = process.stdin.read()
      if (chunk) data += chunk
    })
    // 超时保护：200ms 后还没数据就认为没有 stdin
    setTimeout(() => {
      try {
        resolve(data ? JSON.parse(data) : null)
      } catch {
        resolve(null)
      }
    }, 200)
  })
}

// 通过 HTTP POST 发送事件到桌宠
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
    req.on('error', () => {
      // 桌宠未启动时静默失败
      resolve()
    })
    req.setTimeout(2000, () => {
      req.destroy()
      resolve()
    })
    req.write(body)
    req.end()
  })
}

/**
 * 根据 tool_name 判断状态
 */
function toolToState(toolName) {
  switch (toolName) {
    case 'Think':
      return 'thinking'
    case 'AskUserQuestion':
      return 'waiting_auth'
    case 'Write':
    case 'Edit':
    case 'Bash':
    case 'Glob':
    case 'Grep':
    case 'Read':
    case 'WebFetch':
    case 'WebSearch':
    case 'Task':
    case 'TodoWrite':
      return 'working'
    default:
      return null
  }
}

async function handlePostTool(hookData) {
  if (!hookData) return
  const toolName = hookData.tool_name
  const state = toolToState(toolName)

  if (state) {
    await sendEvent({ type: 'state_change', state })
  }

  // TodoWrite → 更新工作流
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

  // Token 统计 — 从 transcript 累加当日用量
  try {
    const transcriptPath = hookData.transcript_path
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
      let input = 0, output = 0, cacheRead = 0, cacheCreate = 0
      const messages = transcript.messages || []
      for (const msg of messages) {
        const usage = msg.usage || msg.message?.usage || {}
        input += usage.input_tokens || 0
        output += usage.output_tokens || 0
        cacheRead += usage.cache_read_input_tokens || 0
        cacheCreate += usage.cache_creation_input_tokens || 0
      }
      if (input > 0 || output > 0) {
        await sendEvent({
          type: 'token_update',
          tokens: { input, output, cacheRead, cacheCreate, total: input + output },
        })
      }
    }
  } catch { /* ignore parse errors */ }
}

async function handleStop() {
  await sendEvent({ type: 'state_change', state: 'done' })
}

async function handlePreTool(hookData) {
  if (!hookData) return
  const toolName = hookData.tool_name
  if (toolName === 'AskUserQuestion') {
    await sendEvent({ type: 'state_change', state: 'waiting_auth' })
  }
}

// Main
async function main() {
  const hookType = process.argv[2]
  const hookData = await parseStdin()

  switch (hookType) {
    case 'post_tool':
      await handlePostTool(hookData)
      break
    case 'stop':
      await handleStop()
      break
    case 'pre_tool':
      await handlePreTool(hookData)
      break
    default:
      console.error('[phoebe-hook] unknown hook type:', hookType)
  }
}

main().catch(() => {})
