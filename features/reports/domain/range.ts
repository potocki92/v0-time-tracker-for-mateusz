import { addDays } from '@/lib/metrics/period'
import { zonedParts } from '@/lib/date/timezone'
import type { DateKey, ReportFilters, ReportPeriodPreset, ReportRange, WeekdayIndex } from './types'

/**
 * Strefa, w ktorej „dzisiaj" ma znaczenie dla uzytkownika. Ta sama, ktora
 * `lib/format` przypina do kazdego formattera daty — inaczej raport otwarty
 * o 23:30 pokazywalby serwerowe jutro.
 */
const REPORT_TIME_ZONE = 'Europe/Warsaw'

export const REPORT_PERIOD_PRESETS: readonly ReportPeriodPreset[] = [
  'last7d',
  'last30d',
  'last90d',
  'thisMonth',
  'lastMonth',
  'thisQuarter',
  'thisYear',
  'lastYear',
  'custom',
] as const

export const DEFAULT_PERIOD_PRESET: ReportPeriodPreset = 'last30d'

/** Dzisiejsza data kalendarzowa w strefie aplikacji. */
export function todayKey(now: Date = new Date()): DateKey {
  return zonedParts(now, REPORT_TIME_ZONE).date
}

function parts(key: DateKey): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

function key(year: number, month: number, day: number): DateKey {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Ostatni dzien miesiaca (`month` liczony od 1). */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function utcMs(date: DateKey): number {
  const { year, month, day } = parts(date)
  return Date.UTC(year, month - 1, day)
}

/** Liczba dni zakresu WLACZNIE z oboma koncami: `2026-09-01..2026-09-01` to 1 dzien. */
export function spanInDays(range: ReportRange): number {
  return Math.round((utcMs(range.end) - utcMs(range.start)) / 86_400_000) + 1
}

export function isWithinRange(date: DateKey, range: ReportRange): boolean {
  return date >= range.start && date <= range.end
}

/** Wszystkie dni zakresu, wlacznie z granicami. */
export function eachDayInRange(range: ReportRange): DateKey[] {
  const days: DateKey[] = []
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) days.push(day)
  return days
}

/** Poniedzialek = 0 … niedziela = 6. */
export function weekdayIndex(date: DateKey): WeekdayIndex {
  const dow = new Date(utcMs(date)).getUTCDay()
  return ((dow + 6) % 7) as WeekdayIndex
}

/**
 * Zamienia preset na konkretny zakres dat.
 *
 * Presety „biezacy X" konczy sie DZISIAJ, nie ostatniego dnia okresu:
 * raport pokazuje wykonanie, a przyszle dni tylko rozcienczylyby srednie
 * i podbily licznik dni bez pracy.
 *
 * @param preset wybrany preset
 * @param today  dzisiejsza data kalendarzowa (wstrzykiwana, nigdy `new Date()` w srodku)
 * @param from   poczatek zakresu wlasnego — uzywany tylko dla `custom`
 * @param to     koniec zakresu wlasnego — uzywany tylko dla `custom`
 */
export function resolveReportRange(
  preset: ReportPeriodPreset,
  today: DateKey,
  from: DateKey,
  to: DateKey,
): ReportRange {
  const { year, month } = parts(today)

  switch (preset) {
    case 'last7d':
      return { start: addDays(today, -6), end: today }
    case 'last30d':
      return { start: addDays(today, -29), end: today }
    case 'last90d':
      return { start: addDays(today, -89), end: today }
    case 'thisMonth':
      return { start: key(year, month, 1), end: today }
    case 'lastMonth': {
      const y = month === 1 ? year - 1 : year
      const m = month === 1 ? 12 : month - 1
      return { start: key(y, m, 1), end: key(y, m, lastDayOfMonth(y, m)) }
    }
    case 'thisQuarter': {
      const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
      return { start: key(year, quarterStartMonth, 1), end: today }
    }
    case 'thisYear':
      return { start: key(year, 1, 1), end: today }
    case 'lastYear':
      return { start: key(year - 1, 1, 1), end: key(year - 1, 12, 31) }
    case 'custom': {
      // Puste pola (URL bez parametrow) cofaja sie do domyslnych 30 dni,
      // zeby zakres byl zawsze poprawny — bez tego `''..''` dawaloby pusty raport.
      const start = from || addDays(today, -29)
      const end = to || today
      return start <= end ? { start, end } : { start: end, end: start }
    }
  }
}

/** Zakres raportu wynikajacy z kompletu filtrow. */
export function rangeOf(filters: ReportFilters, today: DateKey): ReportRange {
  return resolveReportRange(filters.preset, today, filters.from, filters.to)
}

/**
 * Poprzedni okres: DOKLADNIE tej samej dlugosci, przylegajacy do biezacego
 * od dolu. Dla 1–30 wrzesnia to 2–31 sierpnia, nie „poprzedni miesiac".
 */
export function previousRange(range: ReportRange): ReportRange {
  const span = spanInDays(range)
  const end = addDays(range.start, -1)
  return { start: addDays(end, -(span - 1)), end }
}

/**
 * Okno, ktore musi pobrac serwer: biezacy zakres, a przy wlaczonym porownaniu
 * takze poprzedni. Klucz React Query jedzie z tego okna, wiec przelaczenie
 * „Porownaj" jest jedyna zmiana filtrow, ktora poszerza zapytanie.
 */
export function fetchWindowOf(range: ReportRange, compare: boolean): ReportRange {
  return compare ? { start: previousRange(range).start, end: range.end } : range
}
