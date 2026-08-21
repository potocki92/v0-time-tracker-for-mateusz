'use client'

import { useMemo } from 'react'
import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import {
  selectInvoices,
  selectWorkEntries,
} from '../../../hooks/dashboardSelectors'
import { UpcomingCard, type UpcomingItem } from './UpcomingCard'

function safeDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function UpcomingSection() {
  const workEntries = useDashboardSlice(selectWorkEntries)
  const invoices = useDashboardSlice(selectInvoices)

  const items = useMemo<UpcomingItem[]>(() => {
    const now = Date.now()
    const out: UpcomingItem[] = []

    // Future absences from work entries
    for (const e of workEntries) {
      if (e.status !== 'vacation' && e.status !== 'sick_leave') continue
      const d = safeDate(e.date)
      if (!d || d.getTime() < now) continue
      out.push({
        id: `wkn:${e.id}`,
        date: d,
        title:
          e.status === 'vacation'
            ? `Urlop · ${e.notes ?? ''}`.trimEnd().replace(/·\s*$/, '').trim()
            : `Zwolnienie lekarskie · ${e.notes ?? ''}`.trimEnd().replace(/·\s*$/, '').trim(),
        category: 'vacation',
      })
    }

    // Upcoming invoice due dates (unpaid)
    for (const inv of invoices) {
      if (inv.is_paid) continue
      const d = safeDate(inv.due_date)
      if (!d || d.getTime() < now) continue
      out.push({
        id: `inv:${inv.id}`,
        date: d,
        title: `Termin faktury ${inv.invoice_number ?? inv.name}`,
        category: 'billing',
      })
    }

    return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4)
  }, [workEntries, invoices])

  return <UpcomingCard items={items} />
}
