// app/(app)/dashboard/_services/dashboard.service.server.ts
import 'server-only'
import {
  fetchCurrentUserServer,
  fetchClientsServer,
  fetchWorkEntriesServer,
  fetchInvoicesServer,
  fetchEurRateServer,
} from './dashboard.fetchers.server'
import type { DashboardData } from '@/app/(app)/dashboard/_domain/dashboard.types'

function resolveUserName(metadata: Record<string, unknown>, email?: string): string {
  return (
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata.name === 'string' && metadata.name.trim()) ||
    email?.split('@')[0] ||
    'Użytkowniku'
  )
}

/**
 * Serwerowa wersja getDashboardData.
 *
 * UWAGA: nie woła usePreferencesStore.setLiveRate() bo:
 *  • Zustand store jest per-request na serwerze (zanieczyszczenie)
 *  • i tak dane trafią do HydrationBoundary → useDashboardData()
 *    wywoła się ponownie po hydracji i client-side service ustawi liveRate
 *
 * Jeśli chcesz przekazać kurs do klienta bez drugiego fetchu —
 * dodaj go do DashboardData i czytaj jako `initial` w usePreferencesStore.
 */
export async function getDashboardDataServer(): Promise<DashboardData> {
  const [user, _eurRateLive] = await Promise.all([
    fetchCurrentUserServer(),
    fetchEurRateServer(),
  ])

  const [clients, workEntries, invoices] = await Promise.all([
    fetchClientsServer(user.id),
    fetchWorkEntriesServer(user.id),
    fetchInvoicesServer(user.id),
  ])

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  return {
    userName: resolveUserName(metadata, user.email),
    clients,
    workEntries,
    invoices,
  }
}
