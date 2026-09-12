import { zonedParts } from '@/lib/date/timezone'
import type { DateKey, StatementFilters, StatementPeriodPreset, StatementRange } from './types'

/**
 * Zakresy wykazu.
 *
 * Modul ma WLASNA arytmetyke zakresow zamiast pozyczac ja z `features/reports`:
 * raport pracy jest wyspa, ktora ma dac sie usunac bez ruszania reszty
 * aplikacji (patrz jego README), a wykaz dla ksiegowej chodzi po innych
 * presetach — rozliczenie idzie za rokiem podatkowym i kwartalem, nie za
 * „ostatnimi 30 dniami".
 */

/** Strefa, w ktorej „dzisiaj" ma znaczenie dla uzytkownika — ta sama, co w reszcie panelu. */
const STATEMENT_TIME_ZONE = 'Europe/Warsaw'

export const STATEMENT_PERIOD_PRESETS: readonly StatementPeriodPreset[] = [
  'thisYear',
  'lastYear',
  'thisQuarter',
  'lastQuarter',
  'custom',
] as const

/**
 * Rozliczenie roczne dotyczy roku ZAMKNIETEGO — ksiegowa siega po wykaz po
 * zakonczeniu roku, wiec domyslnym zakresem jest rok poprzedni.
 */
export const DEFAULT_STATEMENT_PRESET: StatementPeriodPreset = 'lastYear'

/** Dzisiejsza data kalendarzowa w strefie aplikacji. */
export function todayKey(now: Date = new Date()): DateKey {
  return zonedParts(now, STATEMENT_TIME_ZONE).date
}

function key(year: number, month: number, day: number): DateKey {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Ostatni dzien miesiaca (`month` liczony od 1). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function parts(date: DateKey): { year: number; month: number } {
  const [year, month] = date.split('-').map(Number)
  return { year, month }
}

/** Kwartal (1..4) dla miesiaca liczonego od 1. */
export function quarterOfMonth(month: number): 1 | 2 | 3 | 4 {
  return (Math.floor((month - 1) / 3) + 1) as 1 | 2 | 3 | 4
}

/** Pelny kwartal kalendarzowy — od pierwszego do ostatniego dnia. */
function quarterRange(year: number, quarter: number): StatementRange {
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2
  return { start: key(year, startMonth, 1), end: key(year, endMonth, lastDayOfMonth(year, endMonth)) }
}

/**
 * Preset → konkretny zakres dat.
 *
 * W przeciwienstwie do raportu pracy zakresy „biezacy X" NIE koncza sie
 * dzisiaj, tylko ostatniego dnia okresu: wykaz jest dokumentem za OKRES,
 * a nie zdjeciem wykonania na dzis. Faktur z przyszla data wystawienia i tak
 * nie ma, wiec ucinanie zakresu niczego by nie zmienilo poza naglowkiem PDF.
 */
export function resolveStatementRange(
  preset: StatementPeriodPreset,
  today: DateKey,
  from: DateKey,
  to: DateKey,
): StatementRange {
  const { year, month } = parts(today)

  switch (preset) {
    case 'thisYear':
      return { start: key(year, 1, 1), end: key(year, 12, 31) }
    case 'lastYear':
      return { start: key(year - 1, 1, 1), end: key(year - 1, 12, 31) }
    case 'thisQuarter':
      return quarterRange(year, quarterOfMonth(month))
    case 'lastQuarter': {
      const current = quarterOfMonth(month)
      return current === 1 ? quarterRange(year - 1, 4) : quarterRange(year, current - 1)
    }
    case 'custom': {
      // Puste pola (adres bez parametrow) cofaja sie do poprzedniego roku,
      // zeby zakres byl zawsze poprawny.
      const fallback = resolveStatementRange('lastYear', today, '', '')
      const start = from || fallback.start
      const end = to || fallback.end
      return start <= end ? { start, end } : { start: end, end: start }
    }
  }
}

/** Zakres wykazu wynikajacy z kompletu filtrow. */
export function rangeOf(filters: StatementFilters, today: DateKey): StatementRange {
  return resolveStatementRange(filters.preset, today, filters.from, filters.to)
}

/**
 * Okno wpisow pracy, ktore trzeba pobrac dla podanych faktur.
 *
 * Faktura wystawiona 3 stycznia moze dotyczyc grudniowej pracy, wiec okno
 * miejsc pracy jest SUMA zakresu wykazu i okresow uslug fakturowanych w tym
 * zakresie. Bez tego kolumna „gdzie" byla by pusta dokladnie dla tych faktur,
 * ktore przechodza przez granice roku — czyli tych, o ktore pyta urzad.
 */
export function workWindowOf(
  range: StatementRange,
  periods: readonly (StatementRange | null)[],
): StatementRange {
  let { start, end } = range

  for (const period of periods) {
    if (!period) continue
    if (period.start < start) start = period.start
    if (period.end > end) end = period.end
  }

  return { start, end }
}
