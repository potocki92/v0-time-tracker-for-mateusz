'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchInvoices } from '../services/dashboard.fetchers'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/query'
import type { Invoice } from '@/lib/types'

/**
 * Granularny hook dla faktur.
 * Używaj gdy potrzebujesz refetchować tylko faktury po mutacji,
 * bez przeładowania całego dashboardu.
 *
 * @example
 * const { data: invoices = [] } = useInvoicesQuery(userId)
 */
export function useInvoicesQuery(userId: string): UseQueryResult<Invoice[]> {
  return useQuery<Invoice[]>({
    queryKey: QUERY_KEYS.invoices(),
    queryFn:  () => fetchInvoices(userId),
    enabled:  Boolean(userId),
    ...QUERY_CONFIG.invoices,
  })
}