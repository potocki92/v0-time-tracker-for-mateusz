'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { INVOICES_MANAGER_QUERY_KEY, type InvoicesData } from '../_domain'
import { getInvoicesData } from '../_services'

export function useInvoicesData() {
  return useSuspenseQuery<InvoicesData>({
    queryKey: INVOICES_MANAGER_QUERY_KEY,
    queryFn: getInvoicesData,
    ...QUERY_CONFIG.invoices,
  })
}
