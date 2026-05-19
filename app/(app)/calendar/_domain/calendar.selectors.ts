import { calculateEarnings } from '@/lib/finance/earnings'
import { getMonthKey, getTodayLocalDateString } from '@/lib/helpers'
import type { Client, WorkEntry } from '@/lib/types'
import { addDaysIso, type Trip } from '@/features/trips/domain'
import { MONTHLY_BASELINE_HOURS } from './calendar.constants'
import type {
  ActiveStreak,
  CalendarStats,
  DayCompositionBreakdown,
  ProjectAggregate,
  RecentEntry,
  WeeklyHoursBar,
} from './calendar.types'

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

export function selectCalendarStats(
  monthEntries: WorkEntry[],
  clients: Client[],
  eurRate: number,
): CalendarStats {
  const workedEntries = monthEntries.filter((e) => e.status === 'worked')
  const todayIso = getTodayLocalDateString()
  const workDays = workedEntries.length
  const freeDays = monthEntries.length - workDays

  let totalHours = 0
  let forecastPLN = 0
  let predictedEarningsPLN = 0
  let realizedEarningsPLN = 0
  let absences = 0

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  for (const entry of workedEntries) {
    totalHours += entry.hours ?? 0
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    const amountInPLN = calculateEarnings(entry, client, eurRate).amountInPLN
    forecastPLN += amountInPLN
    if (entry.date > todayIso) predictedEarningsPLN += amountInPLN
    else realizedEarningsPLN += amountInPLN
  }

  for (const entry of monthEntries) {
    if (entry.status === 'vacation' || entry.status === 'sick_leave') absences++
  }

  const progressPercent = Math.min(100, (totalHours / MONTHLY_BASELINE_HOURS) * 100)

  return {
    totalHours,
    forecastPLN,
    predictedEarningsPLN,
    realizedEarningsPLN,
    workDays,
    freeDays,
    absences,
    progressPercent,
    baselineHours: MONTHLY_BASELINE_HOURS,
    isAhead: progressPercent >= 100,
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Pomocnicze daty
 * ───────────────────────────────────────────────────────────────────────── */

function parseLocalDate(dateStr: string): Date {
  // 'YYYY-MM-DD' → Date w lokalnej strefie (bez przesunięć UTC)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isoWeekNumber(date: Date): { year: number; week: number } {
  // Algorytm ISO 8601 — czwartek tego samego tygodnia trafia do roku z numerem tygodnia.
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff =
    target.getTime() -
    firstThursday.getTime() -
    ((firstThursday.getDay() + 6) % 7) * 86400000
  const week = 1 + Math.round(diff / (7 * 86400000))
  return { year: target.getFullYear(), week }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Active Streak
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Liczy aktualny streak (dni robocze z rzędu pracowane do dziś, pomijając weekendy)
 * oraz najdłuższy streak w bieżącym roku.
 */
export function selectActiveStreak(
  entries: WorkEntry[],
  today: Date = new Date(),
): ActiveStreak {
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

  // Bieżący streak — idziemy wstecz od dziś, omijając weekendy i dni urlopowe.
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

  // Najdłuższy streak — iterujemy po dniach roboczych roku w przód.
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

/* ─────────────────────────────────────────────────────────────────────────
 * Insights agregaty
 * ───────────────────────────────────────────────────────────────────────── */

export function selectHoursPerWeek(
  monthEntries: WorkEntry[],
  year: number,
  month: number,
  daysInMonth: number,
  today: Date = new Date(),
): WeeklyHoursBar[] {
  const buckets = new Map<string, { week: number; year: number; hours: number }>()

  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d)
    const { year: wy, week } = isoWeekNumber(date)
    const key = `${wy}-W${String(week).padStart(2, '0')}`
    if (!buckets.has(key)) buckets.set(key, { week, year: wy, hours: 0 })
  }

  for (const entry of monthEntries) {
    if (entry.status !== 'worked' || !entry.hours) continue
    const date = parseLocalDate(entry.date)
    const { year: wy, week } = isoWeekNumber(date)
    const key = `${wy}-W${String(week).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (bucket) bucket.hours += entry.hours
  }

  const todayWeek = isoWeekNumber(today)

  return Array.from(buckets.entries())
    .sort(([, a], [, b]) =>
      a.year !== b.year ? a.year - b.year : a.week - b.week,
    )
    .map(([key, value]) => ({
      key,
      label: `W${value.week}`,
      hours: Math.round(value.hours * 10) / 10,
      isCurrent: value.week === todayWeek.week && value.year === todayWeek.year,
    }))
}

export function selectTimeByProject(
  monthEntries: WorkEntry[],
  clients: Client[],
  eurRate: number,
): ProjectAggregate[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const buckets = new Map<string, ProjectAggregate>()
  let totalHours = 0

  for (const entry of monthEntries) {
    if (entry.status !== 'worked') continue
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    const id = client?.id ?? '__unassigned'
    const name = client?.name ?? 'Bez klienta'
    const earnings = calculateEarnings(entry, client, eurRate)
    const hours = entry.hours ?? 0
    totalHours += hours

    const existing = buckets.get(id)
    if (existing) {
      existing.hours += hours
      existing.amountPLN += earnings.amountInPLN
      existing.amountNative +=
        earnings.currency === client?.currency ? earnings.amount : 0
    } else {
      buckets.set(id, {
        clientId: id,
        clientName: name,
        color: client?.color ?? '#64748b',
        hours,
        amountPLN: earnings.amountInPLN,
        amountNative: earnings.amount,
        currency: earnings.currency,
        shareOfHours: 0,
      })
    }
  }

  const list = Array.from(buckets.values()).sort((a, b) => b.hours - a.hours)
  if (totalHours > 0) {
    for (const item of list) item.shareOfHours = item.hours / totalHours
  }
  return list
}

export function selectDayComposition(
  monthEntries: WorkEntry[],
  year: number,
  month: number,
  daysInMonth: number,
): DayCompositionBreakdown {
  let weekend = 0
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dow = new Date(year, month, d).getDay()
    if (dow === 0 || dow === 6) weekend += 1
  }

  let worked = 0
  let pto = 0
  let sick = 0
  let off = 0

  for (const e of monthEntries) {
    switch (e.status) {
      case 'worked':
        worked += 1
        break
      case 'vacation':
        pto += 1
        break
      case 'sick_leave':
        sick += 1
        break
      case 'day_off':
      case 'not_worked':
        off += 1
        break
    }
  }

  return { totalDays: daysInMonth, worked, pto, sick, off, weekend }
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
