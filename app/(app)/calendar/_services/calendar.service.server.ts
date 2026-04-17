import 'server-only'
import {
  fetchCurrentUserServer,
  fetchCalendarClientsServer,
  fetchCalendarProjectsServer,
  fetchCalendarWorkEntriesServer,
} from './calendar.fetchers.server'
import type { CalendarData } from '../_domain/calendar.types'

/**
 * Serwerowa wersja getCalendarData — wywoływana w page.tsx (Server Component)
 * do prefetchu przed hydracją. Wynik trafia do HydrationBoundary → useSuspenseQuery.
 */
export async function getCalendarDataServer(): Promise<CalendarData> {
  const user = await fetchCurrentUserServer()

  const [clients, projects, workEntries] = await Promise.all([
    fetchCalendarClientsServer(user.id),
    fetchCalendarProjectsServer(user.id),
    fetchCalendarWorkEntriesServer(user.id),
  ])

  return { clients, projects, workEntries }
}
