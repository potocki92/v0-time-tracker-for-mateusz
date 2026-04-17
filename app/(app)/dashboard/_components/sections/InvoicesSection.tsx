'use client'

import { useDashboardData } from '../../_hooks'
import { useUnpaidInvoices } from '../../_hooks/useUnpaidInvoices'
import { InvoicesList } from '../invoices'
import { InvoicesErrorBoundary } from '../errors'

export function InvoicesSection() {
  const { data } = useDashboardData()
  const unpaidInvoices = useUnpaidInvoices(data.invoices)

  return (
    <InvoicesErrorBoundary>
      <InvoicesList invoices={unpaidInvoices} />
    </InvoicesErrorBoundary>
  )
}
