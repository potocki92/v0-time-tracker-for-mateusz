import {
  fetchCurrentUser,
  fetchProjects,
  fetchProjectsClients,
  fetchProjectsWorkEntries,
} from './projects.fetchers'
import type { ProjectsData } from '../_domain/projects.types'

/**
 * Klient-side service — używany przez useSuspenseQuery po hydracji.
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
