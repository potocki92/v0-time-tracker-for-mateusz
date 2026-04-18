import { useDashboardRange } from '../../sections/DashboardRangeContext'
import type { ChartGrouping } from '../../../_domain/dashboard.types'

export type Grouping = ChartGrouping
export type DateRange = { from: Date | null; to: Date | null }

/**
 * Cienki adapter — chart dziedziczy zakres i grouping z globalnych filtrów URL.
 *
 * Po refaktorze chart nie ma już własnego okresu (PERIOD) — to eliminuje
 * desynchronizację "header ustawił tydzień, chart pokazuje rok".
 * Grouping jest domyślnie `auto` (patrz useDashboardFilters.resolveGrouping),
 * ale użytkownik może wymusić dowolną agregację.
 */
export function useChartState() {
  const {
    range,
    grouping,
    effectiveGrouping,
    dateRange,
    prevRange,
    setGrouping,
  } = useDashboardRange()

  // Daily × duży zakres → zagęszczenie osi X (renderowane w ChartBars).
  const isYearDaily =
    effectiveGrouping === 'daily' &&
    (range === 'current_year' || range === 'all')

  return {
    grouping,
    effectiveGrouping,
    dateRange,
    prevRange,
    isYearDaily,
    setGrouping,
  }
}
