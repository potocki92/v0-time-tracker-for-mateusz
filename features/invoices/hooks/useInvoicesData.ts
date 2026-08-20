'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { INVOICES_MANAGER_QUERY_KEY, type InvoicesData } from '../domain'
import { getInvoicesDataServer } from '../services/server/invoices.service.server'

export function useInvoicesData() {
  return useSuspenseQuery<InvoicesData>({
    queryKey: INVOICES_MANAGER_QUERY_KEY,
    queryFn: () => getInvoicesDataServer(),
    ...QUERY_CONFIG.invoices,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
