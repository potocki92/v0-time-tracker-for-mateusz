import type { WorkEntry } from '@/lib/types'

export type ActiveStreakResult = {
  /** Dni robocze z rzędu przepracowane do dziś. */
  current: number
  /** Najdłuższa taka seria w bieżącym roku. */
  longestThisYear: number
}

/**
 * Seria dni roboczych — wspólna dla karty „Aktywna seria" w Kalendarzu
 * i pigułki serii na karcie Godziny w Pulpicie.
 *
 * Mieszka w `lib/`, bo `__test__/config/module-boundaries.test.ts` zabrania
 * importów `features/*` → `features/*`, a obie sekcje potrzebują tego samego
 * rachunku. Wcześniej istniał tylko w `features/calendar/domain`.
 *
 * Weekendy i dni wolne (urlop, chorobowe, wolne) serii nie przerywają —
 * są przeskakiwane, tak jak w pierwotnej implementacji Kalendarza.
 */
export function computeActiveStreak(
  entries: WorkEntry[],
  today: Date = new Date(),
): ActiveStreakResult {
  const workedSet = new Set(
    entries.filter((e) => e.status === 'worked').map((e) => e.date),
  )
  const offSet = new Set(
    entries
      .filter(
        (e) =>
          e.status === 'vacation' ||
          e.status === 'sick_leave' ||
          e.status === 'day_off',
      )
      .map((e) => e.date),
  )

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`

  // Bieżąca seria — idziemy wstecz od dziś, omijając weekendy i dni wolne.
  let current = 0
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  while (true) {
    const dow = cursor.getDay()
    const key = fmt(cursor)
    if (dow === 0 || dow === 6 || offSet.has(key)) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (workedSet.has(key)) {
      current += 1
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }

  // Najdłuższa seria — iterujemy po dniach roboczych roku w przód.
  const year = today.getFullYear()
  let longest = 0
  let running = 0
  const day = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  while (day <= end) {
    const dow = day.getDay()
    const key = fmt(day)
    if (dow !== 0 && dow !== 6 && !offSet.has(key)) {
      if (workedSet.has(key)) {
        running += 1
        longest = Math.max(longest, running)
      } else if (day <= today) {
        running = 0
      }
    }
    day.setDate(day.getDate() + 1)
  }

  return { current, longestThisYear: Math.max(longest, current) }
}
