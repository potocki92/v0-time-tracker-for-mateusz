'use client'

import { useMemo } from 'react'
import type { Client, Invoice, WorkEntry } from '@/lib/types'
import { toDateKey } from '@/lib/date/format'
import { formatDate, formatHours, formatMoney, toMinor } from '@/lib/format'
import { isRealizedEntry } from '@/lib/finance/realization'
import { getTodayLocalDateString } from '@/lib/helpers'
import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import {
  selectClients,
  selectInvoices,
  selectWorkEntries,
} from '../../../hooks/dashboardSelectors'
import { StatsErrorBoundary } from '../../errors'
import { ActivityCard, type ActivityItem } from './ActivityCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

function relTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'przed chwilą'
  if (m < 60) return `${m} min temu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} godz. temu`
  const d = Math.floor(h / 24)
  if (d === 1) return 'wczoraj'
  if (d < 7) return `${d} dni temu`
  return formatDate(toDateKey(new Date(t)), 'dayMonth')
}

function buildFeed(
  workEntries: WorkEntry[],
  invoices: Invoice[],
  clients: Client[],
  todayIso: string,
): ActivityItem[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const items: ActivityItem[] = []

  // Recent realized worked entries (sorted by created_at) — bez wpisów planowanych.
  const recentEntries = [...workEntries]
    .filter((e) => e.status === 'worked' && (e.hours ?? 0) > 0 && isRealizedEntry(e, todayIso))
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 4)

  for (const e of recentEntries) {
    const c = e.client_id ? clientMap.get(e.client_id) : undefined
    if (!c) continue
    items.push({
      id: `entry:${e.id}`,
      tone: 'success',
      ago: relTime(e.created_at ?? e.date),
      text: (
        <span>
          <span className="font-medium">{c.name}</span> · zarejestrowano{' '}
          <span className="font-semibold">{formatHours(e.hours ?? null)}</span>
          {e.notes ? <> przy <span className="text-zinc-300">{e.notes}</span></> : null}
        </span>
      ),
    })
  }

  // Recent invoices (any state)
  const recentInvoices = [...invoices]
    .sort((a, b) => {
      const ta = new Date(a.invoice_date ?? a.issue_date ?? 0).getTime()
      const tb = new Date(b.invoice_date ?? b.issue_date ?? 0).getTime()
      return tb - ta
    })
    .slice(0, 2)

  for (const inv of recentInvoices) {
    items.push({
      id: `inv:${inv.id}`,
      tone: inv.is_paid ? 'success' : 'info',
      ago: relTime(inv.invoice_date ?? inv.issue_date ?? new Date().toISOString()),
      text: (
        <span>
          {inv.is_paid ? 'Opłacona faktura ' : 'Wystawiona faktura '}
          <span className="font-medium">{inv.invoice_number ?? inv.name}</span>{' '}
          <span className="text-zinc-400">
            ({formatMoney(toMinor(inv.amount), inv.currency)})
          </span>
        </span>
      ),
    })
  }

  return items
    .slice(0, 4)
}

export function ActivitySection() {
  const workEntries = useDashboardSlice(selectWorkEntries)
  const clients = useDashboardSlice(selectClients)
  const invoices = useDashboardSlice(selectInvoices)
  const { realized, totals } = useDashboardDerived()

  const clientsInPeriod = useMemo(
    () => new Set(realized.map((e) => e.client_id).filter(Boolean)).size,
    [realized],
  )

  const defaultClientsCount = useMemo(
    () => clients.filter((c) => c.is_default).length,
    [clients],
  )

  const activeJobs = useMemo(() => {
    const ids = new Set(realized.map((e) => e.project_id).filter(Boolean))
    return ids.size
  }, [realized])

  const totalJobs = useMemo(() => {
    const ids = new Set(workEntries.map((e) => e.project_id).filter(Boolean))
    return Math.max(activeJobs, ids.size)
  }, [workEntries, activeJobs])

  const feed = useMemo(
    () => buildFeed(workEntries, invoices, clients, getTodayLocalDateString()),
    [workEntries, invoices, clients],
  )

  const absences = totals.vacationDays + totals.sickDays

  return (
    <StatsErrorBoundary>
      <ActivityCard
        clientsCount={clientsInPeriod || clients.length}
        defaultClientsCount={defaultClientsCount}
        activeJobs={activeJobs}
        totalJobs={totalJobs || 0}
        absences={absences}
        feed={feed}
      />
    </StatsErrorBoundary>
  )
}
