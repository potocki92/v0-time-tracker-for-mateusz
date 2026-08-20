'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClientRatesAction } from '../actions'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import { withEffectivePeriods } from '../domain/clients.selectors'
import type { ClientRate } from '@/lib/types'
import type { ClientRateWithPeriod } from '../domain/clients.types'

/**
 * Historia stawek dla jednego klienta. Zwraca wpisy z wyliczonymi okresami
 * (effective_to = kolejna data zmiany lub null dla aktualnie obowiązującej).
 * Graceful: jeśli tabela `client_rates` nie istnieje — [].
 */
export function useClientRates(clientId: string | null) {
  const query = useQuery<ClientRate[]>({
    queryKey: QUERY_KEYS.clientRates(clientId ?? 'none'),
    queryFn:  () => fetchClientRatesAction(clientId ?? undefined),
    enabled:  Boolean(clientId),
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
export function useClientRatesMap() {
  return useQuery<Record<string, number>>({
    queryKey: QUERY_KEYS.clientRates(),
    queryFn:  async () => {
      const rows = await fetchClientRatesAction()
      const map: Record<string, number> = {}
      for (const rate of rows) {
        map[rate.client_id] = (map[rate.client_id] ?? 0) + 1
      }
      return map
    },
    ...QUERY_CONFIG.clients,
  })
}
