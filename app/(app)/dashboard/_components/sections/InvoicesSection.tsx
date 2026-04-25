'use client'

import { useMemo } from 'react'
import { useDashboardData } from '../../_hooks'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { InvoicesErrorBoundary } from '../errors'
import { InvoicesCard } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

function periodShort(label: string): string {
  const words = label.split(' ')
  return words[words.length - 1] ?? label
}

export function InvoicesSection() {
  const { data } = useDashboardData()
  const { range, dateRange } = useDashboardRange()
  const periodLabel = usePeriodLabel(range)

  const filtered = useMemo(() => {
    const { from, to } = dateRange
    if (!from || !to) return data.invoices
    const fromMs = from.getTime()
    const toMs = to.getTime()
    return data.invoices.filter((inv) => {
      const ref = inv.invoice_date ?? inv.issue_date ?? inv.due_date
      if (!ref) return false
      const t = new Date(ref).getTime()
      return t >= fromMs && t <= toMs
    })
  }, [data.invoices, dateRange])

  return (
    <InvoicesErrorBoundary>
      <InvoicesCard invoices={filtered} periodShort={periodShort(periodLabel)} />
    </InvoicesErrorBoundary>
  )
}
