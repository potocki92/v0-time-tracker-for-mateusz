import type {
  ComparableMetric,
  MetricDelta,
  ReportComparison,
  ReportKpis,
  ReportRange,
} from './types'

/** Ponizej tego progu zmiana jest szumem, nie trendem. */
const FLAT_THRESHOLD = 0.005

/**
 * Zmiana jednej metryki miedzy okresami.
 *
 * Kluczowy przypadek brzegowy: `previous === 0`. Procent nie istnieje wtedy
 * matematycznie, wiec `ratio` zostaje `null`, a UI czyta `status`:
 *  • `new`   — bylo 0, jest cos (pierwszy klient, pierwszy miesiac projektu),
 *  • `empty` — bylo 0 i nadal jest 0 (brak danych do porownania).
 *
 * Zwracanie „0%" w obu tych sytuacjach bylo bledem poprzedniej wersji.
 */
export function computeDelta(current: number, previous: number): MetricDelta {
  const absolute = current - previous

  if (previous === 0) {
    return {
      current,
      previous,
      absolute,
      ratio: null,
      status: current === 0 ? 'empty' : 'new',
    }
  }

  const ratio = absolute / Math.abs(previous)
  const status = Math.abs(ratio) < FLAT_THRESHOLD ? 'flat' : ratio > 0 ? 'up' : 'down'

  return { current, previous, absolute, ratio, status }
}

/** Metryki, ktore da sie porownac liczbowo. Kolejnosc = kolejnosc kafelkow KPI. */
const COMPARABLE_METRICS: readonly ComparableMetric[] = [
  'totalHours',
  'workValue',
  'activeDays',
  'avgHoursPerActiveDay',
  'effectiveHourlyRate',
  'billableRatio',
] as const

/** Wartosc metryki z KPI. `null` (brak stawki, brak billable) czytamy jako 0. */
function valueOf(kpis: ReportKpis, metric: ComparableMetric): number {
  switch (metric) {
    case 'totalHours':
      return kpis.totalHours
    case 'workValue':
      return kpis.workValueMinor
    case 'activeDays':
      return kpis.activeDays
    case 'avgHoursPerActiveDay':
      return kpis.avgHoursPerActiveDay
    case 'effectiveHourlyRate':
      return kpis.effectiveHourlyRateMinor ?? 0
    case 'billableRatio':
      return kpis.billableRatio ?? 0
  }
}

/** Porownanie kompletu KPI z okresem poprzednim o identycznej dlugosci. */
export function compareKpis(
  current: ReportKpis,
  previous: ReportKpis,
  previousRange: ReportRange,
): ReportComparison {
  const deltas = {} as Record<ComparableMetric, MetricDelta>
  for (const metric of COMPARABLE_METRICS) {
    deltas[metric] = computeDelta(valueOf(current, metric), valueOf(previous, metric))
  }
  return { previousRange, previousKpis: previous, deltas }
}
