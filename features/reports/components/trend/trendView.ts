import type { AppFormat } from '@/lib/format'
import type { CURRENCY } from '@/lib/types'
import type { ReportTrend, TrendBucketUnit, TrendPoint } from '../../domain'

export type TrendMetric = 'hours' | 'value'

/** Punkt wykresu gotowy do podania Rechartsowi — same liczby i gotowa etykieta. */
export type TrendChartPoint = {
  key: string
  label: string
  current: number
  previous: number | null
  /** Peleny opis punktu dla tooltipa i dla listy zastepczej. */
  rangeLabel: string
}

/** Etykieta osi X zalezy od jednostki kubelka: dzien, tydzien ISO albo miesiac. */
function bucketLabel(fmt: AppFormat, point: TrendPoint, unit: TrendBucketUnit): string {
  if (unit === 'day') return fmt.date(point.start, 'dayMonth')
  if (unit === 'week') return fmt.isoWeekShort(point.key)
  return fmt.monthName(point.key, 'short')
}

/**
 * Trend domenowy → dane wykresu.
 *
 * Funkcja jest czysta i wolana raz w `useMemo` — Recharts nigdy nie dostaje
 * mapowania liczonego w trakcie renderu, a tooltip czyta gotowe etykiety
 * zamiast formatowac je przy kazdym ruchu myszy.
 *
 * Wartosci pieniezne ida w JEDNOSTKACH GLOWNYCH: os Y z groszami mialaby
 * czterocyfrowe etykiety przy kazdym slupku.
 */
export function toChartPoints(
  trend: ReportTrend,
  metric: TrendMetric,
  fmt: AppFormat,
): TrendChartPoint[] {
  return trend.points.map((point) => ({
    key: point.key,
    label: bucketLabel(fmt, point, trend.unit),
    current: metric === 'hours' ? point.hours : point.valueBaseMinor / 100,
    previous:
      metric === 'hours'
        ? point.previousHours
        : point.previousValueBaseMinor === null
          ? null
          : point.previousValueBaseMinor / 100,
    rangeLabel:
      point.start === point.end ? fmt.date(point.start, 'long') : fmt.dateRange(point.start, point.end),
  }))
}

/** Sformatowana wartosc metryki — ten sam zapis w tooltipie, na osi i na liscie. */
export function formatMetricValue(
  fmt: AppFormat,
  metric: TrendMetric,
  value: number,
  currency: CURRENCY,
): string {
  return metric === 'hours' ? fmt.hours(value, { decimals: 1 }) : fmt.money(value * 100, currency)
}

/** Skrocony zapis dla osi Y, gdzie liczy sie szerokosc, nie precyzja. */
export function formatAxisValue(
  fmt: AppFormat,
  metric: TrendMetric,
  value: number,
  currency: CURRENCY,
): string {
  return metric === 'hours' ? fmt.number(value) : fmt.moneyCompact(value * 100, currency)
}
