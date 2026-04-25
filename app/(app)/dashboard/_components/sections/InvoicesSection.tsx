'use client'

import { useDashboardData } from '../../_hooks'
import { useUnpaidInvoices } from '../../_hooks/useUnpaidInvoices'
import { InvoicesErrorBoundary } from '../errors'
import { InvoicesLinear } from '../linear'

export function InvoicesSection() {
  const { data } = useDashboardData()
  const unpaidInvoices = useUnpaidInvoices(data.invoices)

  return (
    <InvoicesErrorBoundary>
      <InvoicesLinear invoices={unpaidInvoices} />
    </InvoicesErrorBoundary>
  )
}
