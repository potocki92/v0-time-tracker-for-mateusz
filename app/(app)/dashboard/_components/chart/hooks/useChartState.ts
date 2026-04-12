import { useState, useMemo } from 'react'

export type Grouping = 'daily' | 'weekly' | 'monthly'
export type Period = 'week' | 'month' | 'year'
export type DateRange = { from: Date | null; to: Date | null }

export const PERIOD_OPTIONS: Record<Grouping, { value: Period; label: string }[]> = {
  daily:   [{ value: 'week', label: 'Tydzień' }, { value: 'month', label: 'Miesiąc' }, { value: 'year', label: 'Rok' }],
  weekly:  [{ value: 'month', label: 'Miesiąc' }, { value: 'year', label: 'Rok' }],
  monthly: [{ value: 'year', label: 'Rok' }],
}

const DEFAULT_PERIOD: Record<Grouping, Period> = {
  daily: 'week', weekly: 'month', monthly: 'year',
}

export function getRangeFromPeriod(period: Period): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === 'week') {
    const offset = now.getDay() === 0 ? -6 : 1 - now.getDay()
    const from = new Date(now)
    from.setDate(now.getDate() + offset)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(from.getDate() + 6)
    return { from, to }
  }
  if (period === 'month') return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) }
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }
}

export function getPrevRange(r: DateRange): DateRange {
  if (!r.from || !r.to) return { from: null, to: null }
  const duration = r.to.getTime() - r.from.getTime()
  return {
    from: new Date(r.from.getTime() - duration - 86_400_000),
    to: new Date(r.from.getTime() - 86_400_000),
  }
}

export function useChartState() {
  const [grouping, setGrouping] = useState<Grouping>('daily')
  const [period, setPeriod] = useState<Period>('week')

  function handleGroupingChange(g: Grouping) {
    setGrouping(g)
    setPeriod(DEFAULT_PERIOD[g])
  }

  const dateRange = useMemo(() => getRangeFromPeriod(period), [period])
  const prevRange = useMemo(() => getPrevRange(dateRange), [dateRange])
  const isYearDaily = grouping === 'daily' && period === 'year'

  return { grouping, period, dateRange, prevRange, isYearDaily, handleGroupingChange, setPeriod }
}
