import {
  fetchCurrentUser,
  fetchClients,
  fetchWorkEntries,
  fetchInvoices,
  fetchProjects,
} from './dashboard.fetchers'
import type { DashboardData } from '@/features/dashboard/types/dashboard.types'

function resolveUserName(metadata: Record<string, unknown>, email?: string): string {
  return (
    (typeof metadata.full_name === 'string' && metadata.full_name.trim() ? metadata.full_name : null) ??
    (typeof metadata.name === 'string' && metadata.name.trim() ? metadata.name : null) ??
    email?.split('@')[0] ??
    'Użytkowniku'
  )
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await fetchCurrentUser()

  const [clients, workEntries, invoices, projects] = await Promise.all([
    fetchClients(user.id),
    fetchWorkEntries(user.id),
    fetchInvoices(user.id),
    fetchProjects(user.id),
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
