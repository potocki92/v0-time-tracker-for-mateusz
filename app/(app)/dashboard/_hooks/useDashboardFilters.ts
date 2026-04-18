'use client'

import { useMemo } from 'react'
import { useQueryStates, parseAsStringLiteral } from 'nuqs'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { DateRange } from '@/lib/date/dateRange'
import type { ChartGrouping, TimeRange } from '../_domain/dashboard.types'

/**
 * Wszystkie dozwolone wartości jako const tuple — nuqs potrzebuje literałów.
 * Jeden wspólny spec zapewnia, że range wybrany w headerze i w chart są zsynchronizowane.
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

export const GROUPINGS = ['auto', 'daily', 'weekly', 'monthly', 'quarterly'] as const
export type GroupingParam = (typeof GROUPINGS)[number]

/**
 * Heurystyka auto-grouping. Dobiera agregację do długości okresu tak,
 * żeby wykres miał 7–40 słupków — optymalna gęstość dla szybkiego skanowania.
 */
function resolveGrouping(grouping: GroupingParam, dateRange: DateRange): ChartGrouping {
  if (grouping !== 'auto') return grouping
  if (!dateRange.from || !dateRange.to) return 'daily'

  const days = Math.max(
    1,
    Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000) + 1,
  )
  if (days <= 14) return 'daily'
  if (days <= 90) return 'weekly'
  if (days <= 730) return 'monthly'
  return 'quarterly'
}

/**
 * Zunifikowane filtry dashboardu trzymane w URL (nuqs).
 *
 * Korzyści:
 *   - bookmarkowalny stan ("wyślij koledze link do tego widoku"),
 *   - działający back/forward w historii przeglądarki,
 *   - jedna oś czasu dla wszystkich sekcji (KPI, stats, chart) → brak desynchronizacji.
 *
 * Shallow routing (history: 'replace') — nie renderujemy strony przez router,
 * tylko aktualizujemy URL. Fetchowanie realizuje React Query po stronie klienta.
 */
export function useDashboardFilters() {
  const [query, setQuery] = useQueryStates(
    {
      range: parseAsStringLiteral(TIME_RANGES).withDefault('current_month'),
      grouping: parseAsStringLiteral(GROUPINGS).withDefault('auto'),
    },
    { history: 'replace', clearOnDefault: true },
  )

  const dateRange = useMemo(() => getDateRange(query.range), [query.range])
  const prevRange = useMemo(() => getPrevRange(dateRange), [dateRange])
  const effectiveGrouping = useMemo(
    () => resolveGrouping(query.grouping, dateRange),
    [query.grouping, dateRange],
  )

  return {
    range: query.range,
    grouping: query.grouping,
    effectiveGrouping,
    dateRange,
    prevRange,
    setRange: (range: TimeRange) => setQuery({ range }),
    setGrouping: (grouping: GroupingParam) => setQuery({ grouping }),
  }
}

export type DashboardFilters = ReturnType<typeof useDashboardFilters>
