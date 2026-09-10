import 'server-only'
import { requireServerUser } from '@/lib/auth/server-user'
import { ALL, type ReportsDataset } from '../domain/types'
import type { ReportsQueryParams } from './reports.query'
import {
  fetchReportClientsServer,
  fetchReportEntriesServer,
  fetchReportEurRateServer,
  fetchReportProjectsServer,
} from './reports.fetchers.server'

const asFilter = (value: string): string | null => (value && value !== ALL ? value : null)

/**
 * Dataset raportu dla zadanego okna i przekroju.
 *
 * Uzytkownik jest potrzebny wylacznie do odczytania kursu EUR z profilu —
 * wpisy, klientow i projekty izoluje RLS, wiec te zapytania nie czekaja
 * na `getUser()`.
 */
export async function getReportsDatasetServer(
  params: ReportsQueryParams,
): Promise<ReportsDataset> {
  const [user, entries, clients, projects] = await Promise.all([
    requireServerUser(),
    fetchReportEntriesServer(
      params.window,
      asFilter(params.clientId),
      asFilter(params.projectId),
    ),
    fetchReportClientsServer(),
    fetchReportProjectsServer(),
  ])

  return {
    window: params.window,
    entries,
    clients,
    projects,
    eurRate: await fetchReportEurRateServer(user.id),
  }
}
