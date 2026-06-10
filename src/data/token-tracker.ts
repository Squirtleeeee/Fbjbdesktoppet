// 多时间段 Token 统计

export interface TokenStats {
  input: number
  output: number
  cacheRead: number
  cacheCreate: number
  total: number
}

export interface AllTokenStats {
  conversation: TokenStats
  today: TokenStats
  project: TokenStats
  week: TokenStats
  total: TokenStats
}

const STORAGE_KEY = 'phoebe-token-stats'

interface StoredStats {
  startDate: string           // 统计起点（首次使用日期）
  conversation: TokenStats     // 上次对话（每次 Stop hook 更新）
  daily: Record<string, TokenStats>  // YYYY-MM-DD → stats
  projectTotal: TokenStats    // 本项目累计
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekAgoKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

function emptyStats(): TokenStats {
  return { input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 }
}

function load(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s: StoredStats = JSON.parse(raw)
      if (!s.daily) s.daily = {}
      if (!s.projectTotal) s.projectTotal = emptyStats()
      return s
    }
  } catch { /* ignore */ }
  return {
    startDate: todayKey(),
    conversation: emptyStats(),
    daily: {},
    projectTotal: emptyStats(),
  }
}

function save(s: StoredStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function addStats(a: TokenStats, b: TokenStats): TokenStats {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheCreate: a.cacheCreate + b.cacheCreate,
    total: a.total + b.total,
  }
}

export class TokenTracker {
  private stored: StoredStats

  constructor() {
    this.stored = load()
  }

  // Hook 每次上报时调用
  addConversation(input: number, output: number, cacheRead: number, cacheCreate: number): void {
    const s: TokenStats = { input, output, cacheRead, cacheCreate, total: input + output }

    // 上次对话
    this.stored.conversation = s

    // 今日
    const today = todayKey()
    this.stored.daily[today] = addStats(this.stored.daily[today] || emptyStats(), s)

    // 项目总
    this.stored.projectTotal = addStats(this.stored.projectTotal, s)

    save(this.stored)
  }

  getAllStats(): AllTokenStats {
    const today = todayKey()
    const weekStart = weekAgoKey()

    // 近七天
    let weekStats = emptyStats()
    for (const [date, stats] of Object.entries(this.stored.daily)) {
      if (date >= weekStart) {
        weekStats = addStats(weekStats, stats)
      }
    }

    return {
      conversation: { ...this.stored.conversation },
      today: { ...(this.stored.daily[today] || emptyStats()) },
      project: { ...this.stored.projectTotal },
      week: weekStats,
      total: { ...this.stored.projectTotal },
    }
  }

  getStartDate(): string {
    return this.stored.startDate
  }
}
