import {
  fetchCurrentUser,
  fetchProjects,
  fetchProjectsClients,
  fetchProjectsWorkEntries,
} from './projects.fetchers'
import type { ProjectsData } from '../types/projects.types'

/**
 * Klient-side service — używany przez useSuspenseQuery po hydracji.
 * Składa płaskie dane z fetcherów w jeden agregat ProjectsData.
 */
export async function getProjectsData(): Promise<ProjectsData> {
  const user = await fetchCurrentUser()

  const [projects, clients, workEntries] = await Promise.all([
    fetchProjects(user.id),
    fetchProjectsClients(user.id),
    fetchProjectsWorkEntries(user.id),
  ])

  return { projects, clients, workEntries }
}
