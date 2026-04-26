'use client'

import { useMemo } from 'react'
import type { Invoice } from '@/lib/types'
import { useDashboardData } from '../../_hooks'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { InvoicesErrorBoundary } from '../errors'
import { InvoicesCard } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

function periodShort(label: string): string {
  const words = label.split(' ')
  return words[words.length - 1] ?? label
}

/**
 * Faktura jest "otwarta" (do zapłaty), gdy nie jest opłacona i nie jest
 * w stanie końcowym (PAID / CANCELLED). Takie faktury muszą być widoczne
 * niezależnie od bieżącego zakresu dashboardu — inaczej użytkownik gubi
 * przeterminowane / zaległe pozycje wystawione w poprzednich okresach.
 */
function isOpen(inv: Invoice): boolean {
  if (inv.is_paid) return false
  const status = inv.status
  if (status === 'PAID' || status === 'CANCELLED') return false
  return true
}

function refTime(inv: Invoice): number {
  const ref = inv.invoice_date ?? inv.issue_date ?? inv.due_date ?? inv.created_at
  if (!ref) return 0
  const t = new Date(ref).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function InvoicesSection() {
  const { data } = useDashboardData()
  const { range, dateRange } = useDashboardRange()
  const periodLabel = usePeriodLabel(range)

  const visible = useMemo(() => {
    const { from, to } = dateRange
    const fromMs = from?.getTime() ?? -Infinity
    const toMs = to?.getTime() ?? Infinity

    const inRange: Invoice[] = []
    const openOutsideRange: Invoice[] = []

    for (const inv of data.invoices) {
      const t = refTime(inv)
      const within = t >= fromMs && t <= toMs
      if (within) {
        inRange.push(inv)
      } else if (isOpen(inv)) {
        openOutsideRange.push(inv)
      }
    }

    const merged = [...inRange, ...openOutsideRange]

    // Open invoices first; within each bucket, overdue → due soon → newest.
    return merged.sort((a, b) => {
      const ao = isOpen(a) ? 0 : 1
      const bo = isOpen(b) ? 0 : 1
      if (ao !== bo) return ao - bo

      const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity
      if (isOpen(a) && isOpen(b) && aDue !== bDue) return aDue - bDue

      return refTime(b) - refTime(a)
    })
  }, [data.invoices, dateRange])

  return (
    <InvoicesErrorBoundary>
      <InvoicesCard invoices={visible} periodShort={periodShort(periodLabel)} />
    </InvoicesErrorBoundary>
  )
}
