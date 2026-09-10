import { addDays } from '@/lib/metrics/period'
import type {
  DateKey,
  HeatmapDay,
  ReportInsights,
  ReportRange,
  ReportRecord,
  WeekdayIndex,
  WeekdayLoad,
} from './types'
import { eachDayInRange, spanInDays, weekdayIndex } from './range'

const WEEKDAYS: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6]

/** Godziny w podziale na dni kalendarzowe. Wspolna podstawa insightow i heatmapy. */
function hoursByDate(records: ReportRecord[]): Map<DateKey, number> {
  const byDate = new Map<DateKey, number>()
  for (const record of records) {
    byDate.set(record.date, (byDate.get(record.date) ?? 0) + record.hours)
  }
  return byDate
}

/**
 * Najdluzsza seria kolejnych DNI KALENDARZOWYCH z praca.
 *
 * Seria liczy OBECNOSC wpisu wykonanej pracy, nie godziny: dzien akordowy bez
 * `hours` tez jest dniem pracy i nie moze przerywac serii.
 */
export function longestStreak(activeDates: Iterable<DateKey>): number {
  const sorted = [...new Set(activeDates)].sort()
  let longest = 0
  let current = 0
  let previous: DateKey | null = null

  for (const date of sorted) {
    current = previous !== null && addDays(previous, 1) === date ? current + 1 : 1
    if (current > longest) longest = current
    previous = date
  }

  return longest
}

/**
 * Rytm pracy w zakresie: rozklad na dni tygodnia, najdluzsza seria, najdluzszy
 * dzien i liczba dni bez pracy.
 *
 * Wszystko liczy sie WYLACZNIE z danych, ktore `WorkEntry` naprawde ma —
 * model nie zna godzin rozpoczecia ani zakonczenia pracy, wiec raport ich
 * nie zgaduje.
 */
export function buildInsights(records: ReportRecord[], range: ReportRange): ReportInsights {
  const byDate = hoursByDate(records)
  const spanDays = spanInDays(range)

  const load = new Map<WeekdayIndex, WeekdayLoad>(
    WEEKDAYS.map((weekday) => [weekday, { weekday, hours: 0, activeDays: 0, occurrences: 0 }]),
  )

  for (const day of eachDayInRange(range)) {
    const slot = load.get(weekdayIndex(day))!
    slot.occurrences += 1
    if (byDate.has(day)) {
      slot.activeDays += 1
      slot.hours += byDate.get(day) ?? 0
    }
  }

  const weekdayLoad = WEEKDAYS.map((weekday) => load.get(weekday)!)
  const busiest = weekdayLoad.reduce<WeekdayLoad | null>(
    (best, slot) => (slot.hours > 0 && (!best || slot.hours > best.hours) ? slot : best),
    null,
  )

  let longestDay: ReportInsights['longestDay'] = null
  for (const [date, hours] of byDate) {
    if (hours > 0 && (!longestDay || hours > longestDay.hours)) longestDay = { date, hours }
  }

  return {
    spanDays,
    weekdayLoad,
    busiestWeekday: busiest?.weekday ?? null,
    longestStreakDays: longestStreak(byDate.keys()),
    longestDay,
    daysWithoutWork: Math.max(0, spanDays - byDate.size),
  }
}

/**
 * Prog, od ktorego heatmapa cokolwiek wnosi. Ponizej niego kalendarz jest
 * krotszy niz sekcja rytmu i pokazywalby to samo dwa razy.
 */
const HEATMAP_MIN_SPAN_DAYS = 45

/** Gorna granica — powyzej roku kratki schodza ponizej czytelnego rozmiaru. */
const HEATMAP_MAX_SPAN_DAYS = 400

/**
 * Intensywnosc pracy dzien po dniu, skalowana wzgledem najdluzszego dnia
 * w zakresie. Piec stopni odpowiada `HEATMAP_LEVELS` z tokenow UI.
 *
 * Zwraca `null`, gdy zakres jest za krotki albo za dlugi, zeby heatmapa byla
 * czytelna — decyzje podejmuje domena, nie komponent.
 */
export function buildHeatmap(records: ReportRecord[], range: ReportRange): HeatmapDay[] | null {
  const spanDays = spanInDays(range)
  if (spanDays < HEATMAP_MIN_SPAN_DAYS || spanDays > HEATMAP_MAX_SPAN_DAYS) return null

  const byDate = hoursByDate(records)
  const peak = Math.max(0, ...byDate.values())
  if (peak <= 0) return null

  return eachDayInRange(range).map((date) => {
    const hours = byDate.get(date) ?? 0
    const level = hours <= 0 ? 0 : (Math.min(4, Math.ceil((hours / peak) * 4)) as 1 | 2 | 3 | 4)
    return { date, hours, level }
  })
}
