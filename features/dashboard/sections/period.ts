import type { TimeRange } from '../types/dashboard.types'
import type { DashboardPeriod } from './types'

/**
 * Zakres Pulpitu zyje w URL jako `?range=` (nuqs) i ma siedem wartosci —
 * cztery zakladki plus poprzedni tydzien, poprzedni miesiac i „wszystko".
 * Rejestr sekcji potrzebuje ziarna, nie konkretnego okna, wiec siodemka
 * skleja sie tu do czworki.
 *
 * Wartosc spoza typu (recznie sklejony URL) schodzi do „miesiaca" — nuqs
 * robi to samo dla samego parametru, ale mapowanie nie moze na tym polegac,
 * bo wolaja je tez testy i kod serwerowy.
 */
const BY_RANGE: Record<TimeRange, DashboardPeriod> = {
  current_week: 'week',
  previous_week: 'week',
  current_month: 'month',
  previous_month: 'month',
  current_quarter: 'quarter',
  current_year: 'year',
  all: 'year',
}

export function periodFromRange(range: TimeRange): DashboardPeriod {
  return BY_RANGE[range] ?? 'month'
}
