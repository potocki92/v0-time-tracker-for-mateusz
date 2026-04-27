'use client'

import { useEffect, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { QUERY_CONFIG } from '@/lib/query'
import { useInvoiceFilters } from '@/features/invoices/hooks/useInvoiceFilters'
import { INVOICES_MANAGER_QUERY_KEY, type InvoicesData } from '../_domain'
import { getInvoicesData } from '../_services'

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(timeout)
  }, [delayMs, value])

  return debouncedValue
}

export function useInvoicesData() {
  const filters = useInvoiceFilters()
  const debouncedSearchPhrase = useDebouncedValue(filters.searchPhrase, 350)

  const queryFilters = {
    ...filters,
    searchPhrase: debouncedSearchPhrase,
  }

  return useSuspenseQuery<InvoicesData>({
    queryKey: [...INVOICES_MANAGER_QUERY_KEY, queryFilters],
    queryFn: () => getInvoicesData(queryFilters),
    ...QUERY_CONFIG.invoices,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
