'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClientRates } from '../_services/clients.fetchers'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import { withEffectivePeriods } from '../_domain/clients.selectors'
import type { ClientRate } from '@/lib/types'
import type { ClientRateWithPeriod } from '../_domain/clients.types'

/**
 * Historia stawek dla jednego klienta. Zwraca wpisy z wyliczonymi okresami
 * (effective_to = kolejna data zmiany lub null dla aktualnie obowiązującej).
 * Graceful: jeśli tabela `client_rates` nie istnieje — [].
 */
export function useClientRates(userId: string, clientId: string | null) {
  const query = useQuery<ClientRate[]>({
    queryKey: QUERY_KEYS.clientRates(clientId ?? 'none'),
    queryFn:  () => fetchClientRates(userId, clientId ?? undefined),
    enabled:  Boolean(userId && clientId),
    ...QUERY_CONFIG.clients,
  })

  const rates: ClientRateWithPeriod[] = useMemo(
    () => withEffectivePeriods(query.data ?? []),
    [query.data],
  )

  return { ...query, rates }
}

/**
 * Zbiorczy licznik historii stawek dla wszystkich klientów (do wyświetlenia
 * badge w tabeli: "3 stawki"). Jedno zapytanie dla całej listy.
 */
export function useClientRatesMap(userId: string) {
  return useQuery<Record<string, number>>({
    queryKey: QUERY_KEYS.clientRates(),
    queryFn:  async () => {
      const rows = await fetchClientRates(userId)
      const map: Record<string, number> = {}
      for (const rate of rows) {
        map[rate.client_id] = (map[rate.client_id] ?? 0) + 1
      }
      return map
    },
    enabled: Boolean(userId),
    ...QUERY_CONFIG.clients,
  })
}
