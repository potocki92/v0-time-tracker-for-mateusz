import { getISOWeekNumber, getISOWeekYear } from '@/lib/date/week'
import type { IsoDate, MetricsPeriod } from './types'

/**
 * Arytmetyka na datach kalendarzowych "YYYY-MM-DD".
 *
 * Wszystko liczymy na UTC-owych północach, żeby zmiana czasu w Europe/Warsaw
 * nie przesunęła żadnego dnia — data kalendarzowa nie ma godziny, więc nie ma
 * czego przesuwać.
 */

function toUtc(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIso(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toIso(date)
}

/** 0 = niedziela … 6 = sobota */
function dayOfWeek(iso: IsoDate): number {
  return toUtc(iso).getUTCDay()
}

export function isWeekend(iso: IsoDate): boolean {
  const dow = dayOfWeek(iso)
  return dow === 0 || dow === 6
}

/** Wszystkie dni okna włącznie z granicami. */
export function eachDay(period: MetricsPeriod): IsoDate[] {
  const days: IsoDate[] = []
  for (let day = period.from; day <= period.to; day = addDays(day, 1)) {
    days.push(day)
  }
  return days
}

/** Klucz ISO-tygodnia, np. "2026-W34". Rok bierzemy z ISO, nie kalendarzowy. */
export function isoWeekKey(iso: IsoDate): string {
  const [y, m, d] = iso.split('-').map(Number)
  const local = new Date(y, m - 1, d)
  const week = String(getISOWeekNumber(local)).padStart(2, '0')
  return `${getISOWeekYear(local)}-W${week}`
}

/** Okno obejmujące cały miesiąc. `month` liczony od 0, jak w Date. */
export function monthPeriod(year: number, month: number): MetricsPeriod {
  const label = `${year}-${String(month + 1).padStart(2, '0')}`
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return {
    from: `${label}-01`,
    to: `${label}-${String(lastDay).padStart(2, '0')}`,
    label,
  }
}
