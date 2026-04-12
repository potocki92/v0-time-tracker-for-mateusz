import { getWeekStart } from './week'
import type { TimeRange } from '@/app/(app)/dashboard/_domain/dashboard.types'

export type DateRange = { from: Date | null; to: Date | null }

// ── Zakres z TimeRange (select w headerze) ────────────────────────────────────

export function getDateRange(range: TimeRange, base = new Date()): DateRange {
  const y = base.getFullYear()
  const m = base.getMonth()

  switch (range) {
    case 'current_week': {
      const from = getWeekStart(base)
      const to   = new Date(from)
      to.setDate(from.getDate() + 6)
      return { from, to }
    }
    case 'previous_week': {
      const thisWeek = getWeekStart(base)
      const from     = new Date(thisWeek)
      from.setDate(thisWeek.getDate() - 7)
      const to = new Date(from)
      to.setDate(from.getDate() + 6)
      return { from, to }
    }
    case 'current_month':
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) }

    case 'previous_month':
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) }

    case 'current_quarter': {
      const qStart = Math.floor(m / 3) * 3
      return { from: new Date(y, qStart, 1), to: new Date(y, qStart + 3, 0) }
    }
    case 'current_year':
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }

    case 'all':
    default:
      return { from: null, to: null }
  }
}

export function getPrevRange(range: DateRange): DateRange {
  if (!range.from || !range.to) return { from: null, to: null }

  const duration = range.to.getTime() - range.from.getTime()

  return {
    from: new Date(range.from.getTime() - duration - 86_400_000),
    to:   new Date(range.from.getTime() - 86_400_000),
  }
}
