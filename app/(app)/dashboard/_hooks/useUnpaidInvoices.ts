import { useMemo } from 'react'
import type { Invoice } from '@/lib/types'

export function useUnpaidInvoices(invoices: Invoice[]) {
  return useMemo(
    () => invoices.filter((inv) => !inv.is_paid),
    [invoices]
  )
}
