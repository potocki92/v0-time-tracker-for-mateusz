/**
 * dashboard.service.ts — zaktualizowana wersja po migracji do Zustand (#7)
 *
 * Zmiany względem oryginału:
 * - resolveEurRate() czyta preferowany kurs z PreferencesStore zamiast user_metadata
 * - resolveUserName() bez zmian
 * - getDashboardData() nie zwraca już eurToPlnRate w DashboardData —
 *   każdy komponent czyta go z usePreferencesStore(selectEurRate)
 *
 * Dlaczego to lepsze:
 * - Zmiana kursu w PreferencesStore (np. przez użytkownika w ustawieniach)
 *   natychmiast aktualizuje wszystkie komponenty bez invalidacji query cache
 * - Brak dodatkowego round-tripu do Supabase tylko dla preferencji
 */

import {
  fetchCurrentUser,
  fetchClients,
  fetchWorkEntries,
  fetchInvoices,
  fetchEurRate,
} from './dashboard.fetchers'
import { usePreferencesStore }  from '../_hooks/usePreferencesStore'
import type { DashboardData }   from '@/app/(app)/dashboard/_domain/dashboard.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Service ───────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const user     = await fetchCurrentUser()
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>

  // Pobieramy live rate równolegle z danymi — nie blokuje renderowania
  const [eurRateLive, clients, workEntries, invoices] = await Promise.all([
    fetchEurRate(),
    fetchClients(user.id),
    fetchWorkEntries(user.id),
    fetchInvoices(user.id),
  ])

  // Live rate trafia do store — komponent decyduje czy go używa
  if (eurRateLive !== null) {
    // Aktualizujemy live rate w store bez zmiany preferencji użytkownika
    usePreferencesStore.setState({ useLiveRate: eurRateLive })
  }

  // eurToPlnRate NIE jest już częścią DashboardData — czytaj z usePreferencesStore
  return {
    userName: resolveUserName(metadata, user.email),
    clients,
    workEntries,
    invoices,
    // Usunięto: eurToPlnRate — zastąpione przez usePreferencesStore(selectEurRate)
  }
}