import 'server-only'
import { requireServerUser } from '@/lib/auth/server-user'
import {
  fetchProjectsClientsServer,
  fetchProjectsServer,
  fetchProjectsWorkEntriesServer,
} from './projects.fetchers.server'
import type { ProjectsData } from '../types/projects.types'

/**
 * Serwerowa wersja getProjectsData — używana w page.tsx do prefetchu
 * i hydracji React Query po stronie klienta.
 *
 * Zapytania nie czekają na `getUser()` (scoping robi RLS) — wszystko jedną falą.
 */
export async function getProjectsDataServer(): Promise<ProjectsData> {
  const [, projects, clients, workEntries] = await Promise.all([
    requireServerUser(),
    fetchProjectsServer(),
    fetchProjectsClientsServer(),
    fetchProjectsWorkEntriesServer(),
  ])

  return { projects, clients, workEntries }
}
