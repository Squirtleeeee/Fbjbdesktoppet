import * as http from 'http'
import { WebSocketServer } from 'ws'
import type { BrowserWindow } from 'electron'

export interface PetEvent {
  type: 'state_change'
  state: 'idle' | 'thinking' | 'working' | 'done' | 'waiting_auth'
  payload?: Record<string, unknown>
}

export interface WorkflowEvent {
  type: 'workflow_update'
  steps: { content: string; status: 'pending' | 'in_progress' | 'completed' }[]
  current: number
}

export interface TokenEvent {
  type: 'token_update'
  tokens: {
    input: number
    output: number
    cacheRead: number
    cacheCreate: number
    total: number
  }
}

export type WsMessage = PetEvent | WorkflowEvent | TokenEvent

const PORT = 9527
const MAX_BODY_SIZE = 1024 * 1024 // 1MB limit

function forwardToRenderer(mainWindow: BrowserWindow, msg: WsMessage): void {
  try {
    mainWindow.webContents.send('pet-event', msg)
  } catch {
    // window might be closed
  }
}

export function startWsServer(mainWindow: BrowserWindow): http.Server {
  const server = http.createServer((req, res) => {
    // CORS for localhost
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'POST') {
      let body = ''
      let tooLarge = false
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString()
        if (body.length > MAX_BODY_SIZE) tooLarge = true
      })
      req.on('end', () => {
        if (tooLarge) {
          res.writeHead(413)
          res.end(JSON.stringify({ error: 'Payload too large' }))
          return
        }
        try {
          const msg: WsMessage = JSON.parse(body)
          forwardToRenderer(mainWindow, msg)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: true }))
        } catch (err) {
          res.writeHead(400)
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
        }
      })
      return
    }

    res.writeHead(404)
    res.end('Not found')
  })

  // WebSocket on same server
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    console.log('[pet-ws] ws client connected')
    ws.on('message', (data: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(data.toString())
        forwardToRenderer(mainWindow, msg)
      } catch (err) {
        console.error('[pet-ws] invalid message:', err)
      }
    })
  })

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[pet-ws] listening on http://127.0.0.1:${PORT}`)
  })

  return server
}
