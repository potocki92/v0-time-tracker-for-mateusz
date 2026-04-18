'use client'

import { useMemo } from 'react'
import { useQueryStates, parseAsStringLiteral } from 'nuqs'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { TimeRange } from '../_domain/dashboard.types'

/**
 * Wszystkie dozwolone wartości jako const tuple — nuqs potrzebuje literałów.
 */
export const TIME_RANGES = [
  'current_week',
  'previous_week',
  'current_month',
  'previous_month',
  'current_quarter',
  'current_year',
  'all',
] as const satisfies readonly TimeRange[]

/**
 * Globalny filtr dashboardu (KPI / Stats / Invoices) trzymany w URL.
 *
 * Wyjaśnienie dlaczego tu nie ma już `grouping`: grouping to wymiar wykresu,
 * nie dashboardu. Chart ma własny, niezależny stan (grouping × period)
 * w useChartState → dzięki temu header steruje liczbami, a wykres można
 * eksplorować osobno (np. „dziennie w skali roku" bez zmiany KPI).
 */
export function useDashboardFilters() {
  const [query, setQuery] = useQueryStates(
    {
      range: parseAsStringLiteral(TIME_RANGES).withDefault('current_month'),
    },
    { history: 'replace', clearOnDefault: true },
  )

  const dateRange = useMemo(() => getDateRange(query.range), [query.range])
  const prevRange = useMemo(() => getPrevRange(dateRange), [dateRange])

  return {
    range: query.range,
    dateRange,
    prevRange,
    setRange: (range: TimeRange) => setQuery({ range }),
  }
}

export type DashboardFilters = ReturnType<typeof useDashboardFilters>
