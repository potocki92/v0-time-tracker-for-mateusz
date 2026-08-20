'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_KEYS, QUERY_CONFIG, fetchJson } from '@/lib/query'
import type { ClientsData } from '../domain/clients.types'

/**
 * Główny hook zakładki Klienci — analogiczny do useDashboardData.
 * `data` zawsze zdefiniowane (Suspense obsługuje loading w page.tsx).
 */
export function useClientsData() {
  return useSuspenseQuery<ClientsData>({
    queryKey: QUERY_KEYS.clientsData(),
    queryFn:  () => fetchJson<ClientsData>('/api/clients'),
    ...QUERY_CONFIG.clients,
  })
}
