// 多时间段 Token 统计（增量累加，避免重复计数）

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
  meta: TokenStatsMeta
}

export interface TokenStatsMeta {
  /** 最近一次上报来源 */
  lastSource: 'claude-code' | 'cursor' | 'none'
  /** 当前关联的项目目录（Hook 上报的 cwd） */
  projectKey: string
  /** 用于 UI 展示的短路径名 */
  projectLabel: string
  /** 是否有任何 token 数据 */
  hasData: boolean
}

const STORAGE_KEY = 'phoebe-token-stats-v2'

interface StoredStats {
  startDate: string
  conversation: TokenStats
  conversationLive: TokenStats
  daily: Record<string, TokenStats>
  projects: Record<string, TokenStats>
  globalTotal: TokenStats
  lastCumulative: TokenStats
  lastTranscriptKey: string
  currentProjectKey: string
  lastSource: 'claude-code' | 'cursor' | 'none'
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

function addStats(a: TokenStats, b: TokenStats): TokenStats {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheCreate: a.cacheCreate + b.cacheCreate,
    total: a.total + b.total,
  }
}

function deltaStats(prev: TokenStats, curr: TokenStats): TokenStats {
  return {
    input: Math.max(0, curr.input - prev.input),
    output: Math.max(0, curr.output - prev.output),
    cacheRead: Math.max(0, curr.cacheRead - prev.cacheRead),
    cacheCreate: Math.max(0, curr.cacheCreate - prev.cacheCreate),
    total: Math.max(0, curr.total - prev.total),
  }
}

function migrateLegacy(): StoredStats | null {
  try {
    const raw = localStorage.getItem('phoebe-token-stats')
    if (!raw) return null
    const old = JSON.parse(raw) as {
      startDate?: string
      conversation?: TokenStats
      daily?: Record<string, TokenStats>
      projectTotal?: TokenStats
    }
    return {
      startDate: old.startDate || todayKey(),
      conversation: old.conversation || emptyStats(),
      conversationLive: emptyStats(),
      daily: old.daily || {},
      projects: { default: old.projectTotal || emptyStats() },
      globalTotal: old.projectTotal || emptyStats(),
      lastCumulative: emptyStats(),
      lastTranscriptKey: '',
      currentProjectKey: 'default',
      lastSource: 'none',
    }
  } catch {
    return null
  }
}

function load(): StoredStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s: StoredStats = JSON.parse(raw)
      if (!s.daily) s.daily = {}
      if (!s.projects) s.projects = {}
      if (!s.globalTotal) s.globalTotal = emptyStats()
      if (!s.conversationLive) s.conversationLive = emptyStats()
      if (!s.lastCumulative) s.lastCumulative = emptyStats()
      if (!s.currentProjectKey) s.currentProjectKey = 'default'
      if (!s.lastSource) s.lastSource = 'none'
      return s
    }
  } catch { /* ignore */ }

  const migrated = migrateLegacy()
  if (migrated) {
    save(migrated)
    return migrated
  }

  return {
    startDate: todayKey(),
    conversation: emptyStats(),
    conversationLive: emptyStats(),
    daily: {},
    projects: {},
    globalTotal: emptyStats(),
    lastCumulative: emptyStats(),
    lastTranscriptKey: '',
    currentProjectKey: 'default',
    lastSource: 'none',
  }
}

function save(s: StoredStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function formatProjectLabel(key: string): string {
  if (!key || key === 'default') return '未识别项目'
  const parts = key.replace(/\\/g, '/').split('/').filter(Boolean)
  return parts[parts.length - 1] || key
}

export class TokenTracker {
  private stored: StoredStats

  constructor() {
    this.stored = load()
  }

  /** Hook 上报 transcript 累计用量；只把增量计入今日/项目/全局 */
  updateFromTranscript(
    input: number,
    output: number,
    cacheRead: number,
    cacheCreate: number,
    projectKey: string,
    transcriptKey: string,
    source: 'claude-code' | 'cursor' = 'claude-code',
  ): void {
    const cumulative: TokenStats = {
      input,
      output,
      cacheRead,
      cacheCreate,
      total: input + output,
    }

    if (transcriptKey && transcriptKey !== this.stored.lastTranscriptKey) {
      this.stored.lastCumulative = emptyStats()
      this.stored.lastTranscriptKey = transcriptKey
      this.stored.conversationLive = emptyStats()
    }

    const delta = deltaStats(this.stored.lastCumulative, cumulative)
    this.stored.lastCumulative = { ...cumulative }
    this.stored.conversationLive = { ...cumulative }
    this.stored.currentProjectKey = projectKey || 'default'
    this.stored.lastSource = source

    if (delta.total > 0 || delta.input > 0 || delta.output > 0) {
      const today = todayKey()
      this.stored.daily[today] = addStats(this.stored.daily[today] || emptyStats(), delta)

      const pk = this.stored.currentProjectKey
      this.stored.projects[pk] = addStats(this.stored.projects[pk] || emptyStats(), delta)
      this.stored.globalTotal = addStats(this.stored.globalTotal, delta)
    }

    save(this.stored)
  }

  /** Stop hook：将当前会话快照写入「上次对话」 */
  finalizeConversation(): void {
    this.stored.conversation = { ...this.stored.conversationLive }
    save(this.stored)
  }

  /** 新会话开始 */
  beginSession(): void {
    this.stored.lastCumulative = emptyStats()
    this.stored.lastTranscriptKey = ''
    this.stored.conversationLive = emptyStats()
    save(this.stored)
  }

  getAllStats(): AllTokenStats {
    const today = todayKey()
    const weekStart = weekAgoKey()
    const pk = this.stored.currentProjectKey

    let weekStats = emptyStats()
    for (const [date, stats] of Object.entries(this.stored.daily)) {
      if (date >= weekStart) {
        weekStats = addStats(weekStats, stats)
      }
    }

    const live = this.stored.conversationLive
    const hasLive = live.total > 0
    const conversation = hasLive ? live : this.stored.conversation
    const hasData = this.stored.globalTotal.total > 0
      || conversation.total > 0
      || Object.values(this.stored.daily).some(d => d.total > 0)

    return {
      conversation: { ...conversation },
      today: { ...(this.stored.daily[today] || emptyStats()) },
      project: { ...(this.stored.projects[pk] || emptyStats()) },
      week: weekStats,
      total: { ...this.stored.globalTotal },
      meta: {
        lastSource: this.stored.lastSource,
        projectKey: pk,
        projectLabel: formatProjectLabel(pk),
        hasData,
      },
    }
  }

  getStartDate(): string {
    return this.stored.startDate
  }

  getCurrentProjectKey(): string {
    return this.stored.currentProjectKey
  }
}
