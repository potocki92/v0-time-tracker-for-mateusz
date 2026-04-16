import 'server-only'
import {
  fetchClientsServer,
  fetchCurrentUserIdServer,
  fetchWorkEntriesForClientsServer,
} from './clients.fetchers.server'
import type { ClientsData } from '../_domain/clients.types'

/**
 * Serwerowa wersja getClientsData — używana w page.tsx do prefetch przez HydrationBoundary.
 */
export async function getClientsDataServer(): Promise<ClientsData> {
  const userId = await fetchCurrentUserIdServer()
  const [clients, workEntries] = await Promise.all([
    fetchClientsServer(userId),
    fetchWorkEntriesForClientsServer(userId),
  ])
  return { clients, workEntries }
}
