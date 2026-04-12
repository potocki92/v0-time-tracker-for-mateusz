import { DEFAULT_EUR_TO_PLN } from '@/app/(app)/dashboard/_domain/dashboard.constants'
import {
  fetchCurrentUser,
  fetchClients,
  fetchWorkEntries,
  fetchInvoices,
  fetchEurRate,
} from './dashboard.fetchers'
import type { DashboardData } from '@/app/(app)/dashboard/_domain/dashboard.types'

// ── User meta helper ──────────────────────────────────────────────────────────

function resolveUserName(metadata: Record<string, unknown>, email?: string): string {
  return (
    (typeof metadata.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name
      : null) ??
    (typeof metadata.name === 'string' && metadata.name.trim()
      ? metadata.name
      : null) ??
    email?.split('@')[0] ??
    'Użytkowniku'
  )
}

function resolveEurRate(metadata: Record<string, unknown>, liverate: number | null): number {
  const fromUser = Number(metadata.eur_to_pln)
  if (Number.isFinite(fromUser) && fromUser > 0) return fromUser
  return liverate ?? DEFAULT_EUR_TO_PLN
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Składa pełny obiekt DashboardData z równoległych requestów.
 * To jedyna funkcja którą wolają hooki TanStack Query.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const user     = await fetchCurrentUser()
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  const [eurRateLive, clients, workEntries, invoices] = await Promise.all([
    fetchEurRate(),
    fetchClients(user.id),
    fetchWorkEntries(user.id),
    fetchInvoices(user.id),
  ])

  return {
    userName:    resolveUserName(metadata, user.email),
    eurToPlnRate: resolveEurRate(metadata, eurRateLive),
    clients,
    workEntries,
    invoices,
  }
}