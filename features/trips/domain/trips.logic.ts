import type { Trip, TripCountdownState } from './trips.types'
import { formatDate, formatWeekday } from '@/lib/format'

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

/** Parsuje YYYY-MM-DD do dnia UTC, by uniknąć przesunięć strefy czasowej. */
function parseIsoDate(iso: string): Date {
  if (!ISO_RE.test(iso)) throw new Error(`Niepoprawna data ISO: ${iso}`)
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIsoUtc(now: Date = new Date()): string {
  // "Dzisiaj" liczymy w lokalnej strefie czasowej, ale stempujemy na UTC,
  // żeby wszystkie obliczenia odległości (różnice dni) były spójne.
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

export function diffDays(from: string, to: string): number {
  const a = parseIsoDate(from).getTime()
  const b = parseIsoDate(to).getTime()
  return Math.round((b - a) / MS_PER_DAY)
}

/**
 * Wyznacza stan licznika dla bieżącego dnia.
 *
 * - `endDate` interpretujemy jako dzień powrotu do domu: Mateusz pracuje
 *   w sobotę, a wieczorem wraca do Polski. Dzięki temu licznik
 *   "Powrót do domu" = endDate - today (na ostatnim dniu pokazujemy 0).
 * - `startDate` to pierwszy dzień wyjazdu — "Wyjazd" = startDate - today.
 * - Brak aktualnego/przyszłego wyjazdu → `no_trips`.
 */
export function computeTripCountdown(
  trips: ReadonlyArray<Trip>,
  today: string = todayIsoUtc(),
): TripCountdownState {
  const sorted = [...trips]
    .filter((t) => ISO_RE.test(t.startDate) && ISO_RE.test(t.endDate) && t.startDate <= t.endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const current = sorted.find((t) => t.startDate <= today && today <= t.endDate)
  if (current) {
    return {
      mode: 'away',
      days: diffDays(today, current.endDate),
      targetDate: current.endDate,
      trip: current,
    }
  }

  const next = sorted.find((t) => t.startDate > today)
  if (next) {
    return {
      mode: 'home',
      days: diffDays(today, next.startDate),
      targetDate: next.startDate,
      trip: next,
    }
  }

  return { mode: 'no_trips', days: 0, targetDate: null, trip: null }
}

/** "niedziela, 1 czerwca" — używane jako data celu pod licznikiem. */
export function formatPlLongDate(iso: string): string {
  return `${formatWeekday(iso, 'long')}, ${formatDate(iso, 'dayMonthLong')}`
}

/** Polska forma "dzień / dni" — singular tylko dla |days| === 1. */
export function pluralizeDni(days: number): string {
  return Math.abs(days) === 1 ? 'dzień' : 'dni'
}
