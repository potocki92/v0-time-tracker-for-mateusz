import { calculateTotals } from '@/lib/finance/totals'
import { partitionByRealization } from '@/lib/finance/realization'
import { getTodayLocalDateString } from '@/lib/helpers'
import { defaultMetricsSettings, toMetricsInput } from '@/lib/metrics/adapter'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import type { IsoDate, MetricsPeriod, MonthMetrics } from '@/lib/metrics/types'
import { TIME_RANGE_OPTIONS } from '../types/dashboard.constants'
import type { TimeRange } from '../domain'
import type { Client, MonthlyTotals, WorkEntry } from '@/lib/types'

export type DerivedDateRange = { from: Date | null; to: Date | null }

export interface DashboardDerived {
  /** Wpisy z biezacego zakresu — bez podzialu na zrealizowane i planowane. */
  filtered: WorkEntry[]
  /** Wpisy z poprzedniego zakresu (do trendu). */
  prevFiltered: WorkEntry[]
  /** Zrealizowane z biezacego zakresu — z nich licza sie faktyczne KPI. */
  realized: WorkEntry[]
  /** Planowane z biezacego zakresu — pokazywane osobno. */
  predicted: WorkEntry[]
  /** Zrealizowane z poprzedniego zakresu. */
  prevRealized: WorkEntry[]
  /**
   * Zrealizowane ze WSZYSTKICH wpisow, bez filtra zakresu.
   *
   * Potrzebne tylko sekcji Projekty: buduje z tego liste projektow "kiedykolwiek",
   * a zakresem decyduje wylacznie o tym, ktore z nich sa aktywne. Gdyby czytala
   * `realized`, projekty spoza biezacego zakresu znikalyby z listy.
   */
  realizedAll: WorkEntry[]
  totals: MonthlyTotals
  predictedTotals: MonthlyTotals
  periodLabel: string
  /**
   * Metryki okna z tego samego silnika, z ktorego liczy Kalendarz.
   * Godziny, cel, seria i stawka efektywna maja tu jedno zrodlo — sekcje
   * nie licza ich juz samodzielnie.
   */
  metrics: MonthMetrics
}

export interface DashboardDerivedInput {
  workEntries: WorkEntry[]
  clients: Client[]
  dateRange: DerivedDateRange
  prevRange: DerivedDateRange
  range: TimeRange
  eurRate: number
  todayIso: string
}

/**
 * Filtruje wpisy do zakresu dat.
 *
 * Granice normalizujemy do poczatku/konca dnia — bez tego wpis z data
 * "2024-01-31" (czas 00:00) wypadlby poza zakres, gdy `to` ma inna godzine.
 */
export function filterByDateRange(
  entries: WorkEntry[],
  { from, to }: DerivedDateRange,
): WorkEntry[] {
  if (!from || !to) return entries
  const fromMs = new Date(from).setHours(0, 0, 0, 0)
  const toMs = new Date(to).setHours(23, 59, 59, 999)
  return entries.filter((entry) => {
    const ms = new Date(entry.date).getTime()
    return ms >= fromMs && ms <= toMs
  })
}

/**
 * Liczy CALY zestaw pochodnych dashboardu jednym przebiegiem.
 *
 * Powod istnienia: te same filtry i sumy byly liczone niezaleznie w szesciu
 * sekcjach, kazda z wlasnym useMemo, wiec cache sie nie wspoldzielil —
 * 7x filtr, 7x partycjonowanie, 9x calculateTotals na jedna zmiane zakresu.
 *
 * Funkcja jest czysta i nie zna Reacta: dzieki temu ma prawdziwy test
 * jednostkowy, a provider jest tylko owijka na useMemo.
 */
export function computeDashboardDerived({
  workEntries,
  clients,
  dateRange,
  prevRange,
  range,
  eurRate,
  todayIso,
}: DashboardDerivedInput): DashboardDerived {
  const filtered = filterByDateRange(workEntries, dateRange)
  const prevFiltered = filterByDateRange(workEntries, prevRange)

  const { realized, predicted } = partitionByRealization(filtered, todayIso)
  const { realized: prevRealized } = partitionByRealization(prevFiltered, todayIso)
  const { realized: realizedAll } = partitionByRealization(workEntries, todayIso)

  const periodLabel = TIME_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? ''

  return {
    filtered,
    prevFiltered,
    realized,
    predicted,
    prevRealized,
    realizedAll,
    totals: calculateTotals(realized, clients, eurRate),
    predictedTotals: calculateTotals(predicted, clients, eurRate),
    periodLabel,
    metrics: computeMonthMetrics(
      toMetricsInput({
        period: toMetricsPeriod(dateRange, periodLabel, workEntries, todayIso),
        today: todayIso,
        // Caly zbior, nie `filtered`: okno tnie sam silnik, a seria musi
        // widziec dni sprzed zakresu.
        workEntries,
        clients,
        settings: defaultMetricsSettings(eurRate),
      }),
    ),
  }
}

/**
 * Zakres dashboardu -> okno metryk. Zakres "wszystko" nie ma granic, wiec
 * bierzemy je z danych: od najstarszego wpisu do dzis (albo do ostatniego
 * zaplanowanego dnia, gdy plan siega dalej).
 */
function toMetricsPeriod(
  { from, to }: DerivedDateRange,
  label: string,
  entries: WorkEntry[],
  todayIso: IsoDate,
): MetricsPeriod {
  if (from && to) {
    return { from: getTodayLocalDateString(from), to: getTodayLocalDateString(to), label }
  }
  const dates = entries.map((e) => e.date)
  return {
    from: dates.length ? dates.reduce((min, d) => (d < min ? d : min)) : todayIso,
    to: dates.reduce((max, d) => (d > max ? d : max), todayIso),
    label,
  }
}
