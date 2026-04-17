import {
  fetchCurrentUser,
  fetchCalendarClients,
  fetchCalendarProjects,
  fetchCalendarWorkEntries,
} from './calendar.fetchers'
import type { CalendarData } from '../_domain/calendar.types'

/**
 * Agreguje wszystkie dane potrzebne modułowi kalendarza w jednym miejscu.
 * Analogicznie do dashboard.service.ts.
 */
export async function getCalendarData(): Promise<CalendarData> {
  const user = await fetchCurrentUser()

  const [clients, projects, workEntries] = await Promise.all([
    fetchCalendarClients(user.id),
    fetchCalendarProjects(user.id),
    fetchCalendarWorkEntries(user.id),
  ])

  return { clients, projects, workEntries }
}
