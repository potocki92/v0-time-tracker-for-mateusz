import { getTodayLocalDateString } from '@/lib/helpers'
import type { WorkEntry } from '@/lib/types'

export const HEATMAP_WEEKS = 52
const DAYS_IN_WEEK = 7

export type HeatmapCell = {
  /** Klucz lokalny `YYYY-MM-DD` — ten sam format, co `WorkEntry.date`. */
  date: string
  hours: number
  level: 0 | 1 | 2 | 3 | 4
  /** Dzień po dzisiejszym — rysowany jako pusta ramka, nie jako „0 h". */
  isFuture: boolean
  isToday: boolean
}

export type HeatmapWeek = {
  /** Poniedziałek tygodnia — klucz Reacta i etykieta miesiąca. */
  startDate: string
  /** Skrót miesiąca, gdy w tej kolumnie zaczyna się nowy miesiąc. */
  monthLabel: string | null
  days: HeatmapCell[]
  totalHours: number
}

export type Heatmap = {
  weeks: HeatmapWeek[]
  /** Dni z jakąkolwiek przepracowaną godziną w oknie. */
  activeDays: number
  totalHours: number
}

/** Progi zgodne z poprzednią wersją karty — 2 / 5 / 8 h. */
export function levelFromHours(hours: number): HeatmapCell['level'] {
  if (hours <= 0) return 0
  if (hours < 2) return 1
  if (hours < 5) return 2
  if (hours < 8) return 3
  return 4
}

const MONTHS = [
  'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
  'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
]

/**
 * Buduje siatkę 52 tygodni × 7 dni w układzie GitHuba: kolumna to tydzień
 * (poniedziałek u góry), ostatnia kolumna to tydzień bieżący.
 *
 * Dwie rzeczy, które poprzednia wersja robiła źle:
 *
 * 1. Klucz dnia szedł przez `toISOString()`, czyli przez UTC, podczas gdy
 *    `WorkEntry.date` i punkt odniesienia były lokalne. W strefie UTC+2
 *    lokalna północ to 22:00 dnia poprzedniego, więc godziny lądowały
 *    w komórce o dzień wcześniejszej.
 *
 * 2. Kotwica nazywała się `lastSunday`, ale liczyła niedzielę NADCHODZĄCĄ,
 *    więc w poniedziałek siatka pokazywała sześć pustych dni z przyszłości
 *    i gubiła sześć dni przeszłych.
 */
export function buildHeatmap(
  entries: WorkEntry[],
  today: Date = new Date(),
): Heatmap {
  const todayIso = getTodayLocalDateString(today)

  const hoursByDate = new Map<string, number>()
  for (const entry of entries) {
    if (entry.status !== 'worked') continue
    hoursByDate.set(
      entry.date,
      (hoursByDate.get(entry.date) ?? 0) + (entry.hours ?? 0),
    )
  }

  // Poniedziałek pierwszej kolumny: cofamy się o 51 pełnych tygodni od
  // poniedziałku tygodnia bieżącego.
  const dayOfWeek = (today.getDay() + 6) % 7 // 0 = poniedziałek
  const firstMonday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - dayOfWeek - (HEATMAP_WEEKS - 1) * DAYS_IN_WEEK,
  )

  const weeks: HeatmapWeek[] = []
  let activeDays = 0
  let totalHours = 0
  let previousMonth = -1

  for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
    const days: HeatmapCell[] = []
    let weekHours = 0

    for (let d = 0; d < DAYS_IN_WEEK; d += 1) {
      const date = new Date(
        firstMonday.getFullYear(),
        firstMonday.getMonth(),
        firstMonday.getDate() + w * DAYS_IN_WEEK + d,
      )
      const iso = getTodayLocalDateString(date)
      const isFuture = iso > todayIso
      const hours = isFuture ? 0 : (hoursByDate.get(iso) ?? 0)

      if (hours > 0) {
        activeDays += 1
        weekHours += hours
        totalHours += hours
      }

      days.push({
        date: iso,
        hours,
        level: levelFromHours(hours),
        isFuture,
        isToday: iso === todayIso,
      })
    }

    // Miesiąc kolumny bierzemy z CZWARTKU, nie z poniedziałku, i nie
    // etykietujemy kolumny zerowej. Inaczej pierwszy — zwykle ucięty —
    // miesiąc dostawał etykietę tuż obok następnej i oba napisy się zlewały
    // („siewrz"), bo etykieta jest szersza niż kolumna 13 px.
    const month = Number(days[3].date.slice(5, 7)) - 1
    const isNewMonth = month !== previousMonth

    weeks.push({
      startDate: days[0].date,
      monthLabel: isNewMonth && w > 0 ? MONTHS[month] : null,
      days,
      totalHours: weekHours,
    })
    previousMonth = month
  }

  return { weeks, activeDays, totalHours }
}
