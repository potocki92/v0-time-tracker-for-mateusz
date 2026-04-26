'use client'

import { useQuery } from '@tanstack/react-query'
import {
  INVOICES_MANAGER_QUERY_KEY,
  type InvoicesData,
} from '@/app/(app)/invoices/_domain'
import { getInvoicesData } from '@/app/(app)/invoices/_services'

/**
 * Liczy "kontekstowe" wskaźniki widoczne w sidebarze (np. liczbę nieopłaconych
 * faktur). Hook celowo NIE używa Suspense: layout nie powinien czekać na te
 * dane — gdy ich brak, badge po prostu się nie pojawi. Po wejściu na stronę
 * faktur cache jest dzielony, więc wskaźnik jest natychmiastowy.
 */
export function useSidebarBadges(): Partial<Record<string, number>> {
  const { data } = useQuery<InvoicesData>({
    queryKey: INVOICES_MANAGER_QUERY_KEY,
    queryFn: getInvoicesData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  if (!data) return {}

  const unpaid = data.invoices.filter((inv) => {
    if (inv.is_paid) return false
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') return false
    return true
  }).length

  return {
    '/invoices': unpaid,
  }
}
