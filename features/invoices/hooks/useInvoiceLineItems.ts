'use client'

import { useQuery } from '@tanstack/react-query'
import type { InvoiceLineItem } from '@/lib/types'
import { listInvoiceLineItems } from '../services/server/invoice-line-items.service.server'

/**
 * Pobiera pozycje danej faktury z serwera. Włącza się dopiero przy
 * niepustym `invoiceId`, dzięki czemu można go bezpiecznie wywołać z
 * komponentu, który nie ma jeszcze edytowanej faktury.
 */
export function useInvoiceLineItems(invoiceId: string | null | undefined) {
  return useQuery<InvoiceLineItem[]>({
    queryKey: ['invoice', invoiceId, 'line-items'],
    queryFn: () => listInvoiceLineItems(invoiceId as string),
    enabled: Boolean(invoiceId),
    staleTime: 30_000,
  })
}
