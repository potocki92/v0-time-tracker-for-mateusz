'use client'

import { useMemo } from 'react'
import { useQueryStates, parseAsStringLiteral } from 'nuqs'
import type { ChartGrouping } from '../../../_domain/dashboard.types'

export type Grouping = ChartGrouping
export type Period = 'week' | 'month' | 'year'
export type DateRange = { from: Date | null; to: Date | null }

const GROUPINGS = ['daily', 'weekly', 'monthly', 'quarterly'] as const
const PERIODS = ['week', 'month', 'year'] as const

/**
 * Dwuwymiarowa kontrolka (grouping × period):
 *   daily       → week | month | year   (dni w obrębie tygodnia/miesiąca/roku)
 *   weekly      → month | year          (tygodnie w obrębie miesiąca/roku)
 *   monthly     → year                  (miesiące w obrębie roku)
 *   quarterly   → year                  (kwartały w obrębie roku)
 *
 * Dzięki temu „dziennie" z rozrzutem rocznym wciąż jest osiągalne —
 * użytkownik widzi, w które dni roku faktycznie pracował.
 */
export const PERIOD_OPTIONS: Record<Grouping, { value: Period; label: string }[]> = {
  daily: [
    { value: 'week', label: 'Tydzień' },
    { value: 'month', label: 'Miesiąc' },
    { value: 'year', label: 'Rok' },
  ],
  weekly: [
    { value: 'month', label: 'Miesiąc' },
    { value: 'year', label: 'Rok' },
  ],
  monthly: [{ value: 'year', label: 'Rok' }],
  quarterly: [{ value: 'year', label: 'Rok' }],
}

const DEFAULT_PERIOD: Record<Grouping, Period> = {
  daily: 'week',
  weekly: 'month',
  monthly: 'year',
  quarterly: 'year',
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
  if (period === 'month') {
    return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) }
  }
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) }
}

function getPrevRangeFromDateRange(r: DateRange): DateRange {
  if (!r.from || !r.to) return { from: null, to: null }
  const duration = r.to.getTime() - r.from.getTime()
  return {
    from: new Date(r.from.getTime() - duration - 86_400_000),
    to: new Date(r.from.getTime() - 86_400_000),
  }
}

/**
 * Chart ma WŁASNY, niezależny od headera zakres (grouping × period) trzymany w URL.
 *
 * Intencja: header steruje KPI / Stats / Invoices („co widzę w liczbach"),
 * chart pozwala eksplorować historyczne tempo niezależnie — np. „dziennie w skali roku"
 * bez zmiany widoku KPI na cały rok. Stan jest bookmarkowalny dzięki nuqs.
 */
export function useChartState() {
  const [query, setQuery] = useQueryStates(
    {
      cg: parseAsStringLiteral(GROUPINGS).withDefault('daily'),
      cp: parseAsStringLiteral(PERIODS).withDefault('week'),
    },
    { history: 'replace', clearOnDefault: true },
  )

  const grouping = query.cg

  // Sanitize: gdy URL niesie period niedozwolony dla bieżącego grouping
  // (np. ktoś ręcznie podmienił param), wracamy do domyślnego period.
  const allowedPeriods = PERIOD_OPTIONS[grouping].map((o) => o.value)
  const period: Period = allowedPeriods.includes(query.cp)
    ? query.cp
    : DEFAULT_PERIOD[grouping]

  const dateRange = useMemo(() => getRangeFromPeriod(period), [period])
  const prevRange = useMemo(() => getPrevRangeFromDateRange(dateRange), [dateRange])

  const isYearDaily = grouping === 'daily' && period === 'year'

  const handleGroupingChange = (g: Grouping) => {
    setQuery({ cg: g, cp: DEFAULT_PERIOD[g] })
  }

  const setPeriod = (p: Period) => setQuery({ cp: p })

  return {
    grouping,
    period,
    dateRange,
    prevRange,
    isYearDaily,
    handleGroupingChange,
    setPeriod,
  }
}
