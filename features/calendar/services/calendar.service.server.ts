import 'server-only'
import { requireServerUser } from '@/lib/auth/server-user'
import {
  fetchCalendarClientsServer,
  fetchCalendarProjectsServer,
  fetchCalendarWorkEntriesServer,
} from './calendar.fetchers.server'
import type { CalendarData } from '../domain/calendar.types'

/**
 * Serwerowa wersja getCalendarData — wywoływana w page.tsx (Server Component)
 * do prefetchu przed hydracją. Wynik trafia do HydrationBoundary → useSuspenseQuery.
 *
 * `requireServerUser()` jedzie równolegle z zapytaniami (nie blokuje ich) —
 * służy tylko do wymuszenia 401 gdy sesja wygasła; dane i tak filtruje RLS.
 */
export async function getCalendarDataServer(): Promise<CalendarData> {
  const [, clients, projects, workEntries] = await Promise.all([
    requireServerUser(),
    fetchCalendarClientsServer(),
    fetchCalendarProjectsServer(),
    fetchCalendarWorkEntriesServer(),
  ])

  return { clients, projects, workEntries }
}
