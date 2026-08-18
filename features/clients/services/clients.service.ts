import {
  fetchClients,
  fetchCurrentUserId,
  fetchWorkEntriesForClients,
} from './clients.fetchers'
import type { ClientsData } from '../domain/clients.types'

/**
 * Kliencka orkiestracja — używana przez useSuspenseQuery w ClientsContent.
 * Paralelizuje user + zasoby, analogicznie do dashboard.service.
 */
export async function getClientsData(): Promise<ClientsData> {
  const userId = await fetchCurrentUserId()
  const [clients, workEntries] = await Promise.all([
    fetchClients(userId),
    fetchWorkEntriesForClients(userId),
  ])
  return { clients, workEntries }
}
