import { calculateEarnings } from '@/lib/finance/earnings'
import { getMonthKey } from '@/lib/helpers'
import type { Client, WorkEntry } from '@/lib/types'
import { MONTHLY_BASELINE_HOURS } from './calendar.constants'
import type { CalendarStats } from './calendar.types'

/**
 * Selektory — pure functions operujące na surowych danych.
 * Analogia do dashboard.selectors.ts: żadnej React-owej logiki.
 */

export function selectEntriesByDate(entries: WorkEntry[]): Map<string, WorkEntry> {
  const map = new Map<string, WorkEntry>()
  for (const entry of entries) map.set(entry.date, entry)
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
  const workDays = workedEntries.length
  const freeDays = monthEntries.length - workDays

  let totalHours = 0
  let forecastPLN = 0
  let absences = 0

  const clientMap = new Map(clients.map((c) => [c.id, c]))

  for (const entry of workedEntries) {
    totalHours += entry.hours ?? 0
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    forecastPLN += calculateEarnings(entry, client, eurRate).amountInPLN
  }

  for (const entry of monthEntries) {
    if (entry.status === 'vacation' || entry.status === 'sick_leave') absences++
  }

  const progressPercent = Math.min(100, (totalHours / MONTHLY_BASELINE_HOURS) * 100)

  return {
    totalHours,
    forecastPLN,
    workDays,
    freeDays,
    absences,
    progressPercent,
    baselineHours: MONTHLY_BASELINE_HOURS,
    isAhead: progressPercent >= 100,
  }
}
