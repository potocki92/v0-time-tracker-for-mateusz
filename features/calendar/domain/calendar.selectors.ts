import { calculateEarnings } from '@/lib/finance/earnings'
import { getMonthKey } from '@/lib/helpers'
import type { Client, WorkEntry } from '@/lib/types'
import { addDaysIso, type Trip } from '@/features/trips/domain'
import type { RecentEntry } from './calendar.types'

export type TripDayMarker = {
  tripId: string
  destination?: string
  roundLeft: boolean
  roundRight: boolean
}

/**
 * Selektory — pure functions operujące na surowych danych.
 * Analogia do dashboard.selectors.ts: żadnej React-owej logiki.
 */

export function selectEntriesByDate(entries: WorkEntry[]): Map<string, WorkEntry[]> {
  const map = new Map<string, WorkEntry[]>()
  for (const entry of entries) {
    const dateEntries = map.get(entry.date) ?? []
    dateEntries.push(entry)
    map.set(entry.date, dateEntries)
  }
  return map
}

export function selectMonthEntries(
  entries: WorkEntry[],
  year: number,
  month: number,
): WorkEntry[] {
  const prefix = getMonthKey(year, month)
  return entries.filter((e) => e.date.startsWith(prefix))
}

export function selectDefaultClient(clients: Client[]): Client | undefined {
  return clients.find((c) => c.is_default)
}

export function selectClientProjects<T extends { client_id: string }>(
  projects: T[],
  clientId: string,
): T[] {
  return projects.filter((p) => p.client_id === clientId)
}

/* ─────────────────────────────────────────────────────────────────────────
 * Pomocnicze daty
 * ───────────────────────────────────────────────────────────────────────── */

function parseLocalDate(dateStr: string): Date {
  // 'YYYY-MM-DD' → Date w lokalnej strefie (bez przesunięć UTC)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* ─────────────────────────────────────────────────────────────────────────
 * Wyjazdy w siatce kalendarza
 * ───────────────────────────────────────────────────────────────────────── */

function isoForDay(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

/**
 * Dla danego miesiąca zwraca informację, które dni należą do jakiegoś wyjazdu
 * i czy ich lewa/prawa krawędź ma być zaokrąglona (czyli: jest pierwsza/ostatnia
 * w widocznym pasmie wyjazdu, gdzie pasmo łamie się również na końcu/początku
 * tygodnia w siatce 7-kolumnowej PN..ND).
 */
export function selectTripDayMarkers(
  trips: ReadonlyArray<Trip>,
  year: number,
  month: number,
  daysInMonth: number,
  firstDayOfMonth: number,
): Map<number, TripDayMarker> {
  const result = new Map<number, TripDayMarker>()
  if (!trips.length) return result

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = isoForDay(year, month, day)
    const trip = trips.find((t) => t.startDate <= iso && iso <= t.endDate)
    if (!trip) continue

    const prev = addDaysIso(iso, -1)
    const next = addDaysIso(iso, 1)
    const prevInSameTrip = trip.startDate <= prev && prev <= trip.endDate
    const nextInSameTrip = trip.startDate <= next && next <= trip.endDate

    const column = (firstDayOfMonth + day - 1) % 7
    const roundLeft = column === 0 || !prevInSameTrip
    const roundRight = column === 6 || !nextInSameTrip

    result.set(day, {
      tripId: trip.id,
      destination: trip.destination,
      roundLeft,
      roundRight,
    })
  }

  return result
}

export function selectRecentEntries(
  entries: WorkEntry[],
  clients: Client[],
  eurRate: number,
  days = 7,
): RecentEntry[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const sorted = [...entries].sort(
    (a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime(),
  )

  const result: RecentEntry[] = []
  for (const entry of sorted) {
    if (entry.status !== 'worked') continue
    if (result.length >= days) break
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    const earnings = calculateEarnings(entry, client, eurRate)
    result.push({
      id: entry.id,
      date: entry.date,
      clientName: client?.name ?? null,
      notes: entry.notes,
      hours: entry.hours ?? 0,
      amountPLN: earnings.amountInPLN,
      amountNative: earnings.amount,
      currency: earnings.currency,
    })
  }
  return result
}
