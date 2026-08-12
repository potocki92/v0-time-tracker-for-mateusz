import 'server-only'
import { requireServerUser } from '@/lib/auth/server-user'
import {
  fetchClientsServer,
  fetchWorkEntriesForClientsServer,
} from './clients.fetchers.server'
import type { ClientsData } from '../_domain/clients.types'

/**
 * Serwerowa wersja getClientsData — używana w page.tsx do prefetch przez HydrationBoundary.
 *
 * Zapytania nie czekają na `getUser()` (scoping robi RLS) — wszystko jedną falą.
 */
export async function getClientsDataServer(): Promise<ClientsData> {
  const [, clients, workEntries] = await Promise.all([
    requireServerUser(),
    fetchClientsServer(),
    fetchWorkEntriesForClientsServer(),
  ])

  return { clients, workEntries }
}
