/**
 * Czysta arytmetyka na kluczach dat w formacie `YYYY-MM-DD`.
 *
 * Klucz dat (a nie `Date`) używamy świadomie:
 *  • porównanie zakresów to leksykograficzne `>=` / `<=` (brak strefy),
 *  • brak edge-case'ów DST przy przesuwaniu o N dni.
 */

export type DateKey = string

export function getDateKey(date: Date): DateKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function offsetDateKey(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return getDateKey(date)
}

export function isWithin(date: DateKey, start: DateKey, end: DateKey): boolean {
  return date >= start && date <= end
}

export function daysBetween(start: DateKey, end: DateKey): number {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const ms = new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()
  return Math.round(ms / 86_400_000)
}
