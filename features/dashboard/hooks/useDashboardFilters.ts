'use client'

import { useCallback, useMemo } from 'react'
import { useQueryStates, parseAsStringLiteral } from 'nuqs'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { TimeRange } from '../types/dashboard.types'

/**
 * Wszystkie dozwolone wartości jako const tuple — nuqs potrzebuje literałów.
 */
const TIME_RANGES = [
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

  const setRange = useCallback(
    (range: TimeRange) => setQuery({ range }),
    [setQuery],
  )

  // Literal obiektu tworzony przy kazdym renderze trafial jako `value`
  // do DashboardFiltersContext, wiec KAZDY konsument useDashboardRange()
  // re-renderowal sie przy kazdym renderze providera — takze wtedy,
  // gdy zakres sie nie zmienil.
  return useMemo(
    () => ({ range: query.range, dateRange, prevRange, setRange }),
    [query.range, dateRange, prevRange, setRange],
  )
}

export type DashboardFilters = ReturnType<typeof useDashboardFilters>
