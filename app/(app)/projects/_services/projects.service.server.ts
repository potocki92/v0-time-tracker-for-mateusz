import 'server-only'
import {
  fetchCurrentUserServer,
  fetchProjectsClientsServer,
  fetchProjectsServer,
  fetchProjectsWorkEntriesServer,
} from './projects.fetchers.server'
import type { ProjectsData } from '../_domain/projects.types'

/**
 * Serwerowa wersja getProjectsData — używana w page.tsx do prefetchu
 * i hydracji React Query po stronie klienta.
 */
export async function getProjectsDataServer(): Promise<ProjectsData> {
  const user = await fetchCurrentUserServer()

  const [projects, clients, workEntries] = await Promise.all([
    fetchProjectsServer(user.id),
    fetchProjectsClientsServer(user.id),
    fetchProjectsWorkEntriesServer(user.id),
  ])

  return { projects, clients, workEntries }
}
