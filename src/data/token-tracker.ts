// 当日 Token 统计（按自然日重置）

export interface DailyTokenStats {
  date: string // YYYY-MM-DD
  input: number
  output: number
  cacheRead: number
  cacheCreate: number
  total: number
}

const STORAGE_KEY = 'phoebe-daily-tokens'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadStats(): DailyTokenStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stats: DailyTokenStats = JSON.parse(raw)
      if (stats.date === todayKey()) return stats
    }
  } catch { /* ignore */ }
  return { date: todayKey(), input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 }
}

function saveStats(stats: DailyTokenStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

export class TokenTracker {
  private stats: DailyTokenStats

  constructor() {
    this.stats = loadStats()
  }

  add(input: number, output: number, cacheRead: number, cacheCreate: number): DailyTokenStats {
    this.stats.input += input
    this.stats.output += output
    this.stats.cacheRead += cacheRead
    this.stats.cacheCreate += cacheCreate
    this.stats.total += input + output
    saveStats(this.stats)
    return { ...this.stats }
  }

  getStats(): DailyTokenStats {
    return { ...this.stats }
  }

  resetIfNewDay(): DailyTokenStats {
    const today = todayKey()
    if (this.stats.date !== today) {
      this.stats = { date: today, input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 }
      saveStats(this.stats)
    }
    return { ...this.stats }
  }
}
