// app/(app)/dashboard/_services/dashboard.service.server.ts
import 'server-only'
import { requireServerUser } from '@/lib/auth/server-user'
import {
  fetchClientsServer,
  fetchWorkEntriesServer,
  fetchInvoicesServer,
  fetchProjectsServer,
} from './dashboard.fetchers.server'
import type { DashboardData } from '@/features/dashboard/types/dashboard.types'

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
 * Wszystko leci jedną falą: zapytania nie czekają na `getUser()`, bo scoping
 * po użytkowniku robi RLS (`auth.uid() = user_id`). Użytkownik jest potrzebny
 * wyłącznie do wyświetlenia imienia.
 *
 * UWAGA: nie woła usePreferencesStore.setLiveRate() bo:
 *  • Zustand store jest per-request na serwerze (zanieczyszczenie)
 *  • i tak dane trafią do HydrationBoundary → useDashboardData()
 *    wywoła się ponownie po hydracji i client-side service ustawi liveRate
 */
export async function getDashboardDataServer(): Promise<DashboardData> {
  const [user, clients, workEntries, invoices, projects] = await Promise.all([
    requireServerUser(),
    fetchClientsServer(),
    fetchWorkEntriesServer(),
    fetchInvoicesServer(),
    fetchProjectsServer(),
  ])

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  return {
    userName: resolveUserName(metadata, user.email),
    clients,
    workEntries,
    invoices,
    projects,
  }
}
