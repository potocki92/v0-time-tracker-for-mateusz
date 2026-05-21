'use client'

import { useMemo } from 'react'
import type { Client, Invoice, WorkEntry } from '@/lib/types'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import { ActivityCard, type ActivityItem } from '../linear'
import { StatsErrorBoundary } from '../errors'
import { useDashboardRange } from './DashboardRangeContext'

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
  return new Date(t).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })
}

function buildFeed(
  workEntries: WorkEntry[],
  invoices: Invoice[],
  clients: Client[],
): ActivityItem[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const items: ActivityItem[] = []

  // Recent worked entries (without full sort)
  const recentEntries = workEntries
    .filter((e) => e.status === 'worked' && (e.hours ?? 0) > 0)
    .reduce<WorkEntry[]>((acc, entry) => {
      const stamp = entry.created_at ?? ''
      let i = 0
      while (i < acc.length && (acc[i].created_at ?? '') >= stamp) i += 1
      if (i < 4) {
        acc.splice(i, 0, entry)
        if (acc.length > 4) acc.pop()
      }
      return acc
    }, [])

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
          <span className="font-semibold">{e.hours?.toFixed(1)} h</span>
          {e.notes ? <> przy <span className="text-zinc-300">{e.notes}</span></> : null}
        </span>
      ),
    })
  }

  // Recent invoices (without full sort)
  const recentInvoices = invoices.reduce<Invoice[]>((acc, invoice) => {
    const stamp = new Date(invoice.invoice_date ?? invoice.issue_date ?? 0).getTime()
    let i = 0
    while (i < acc.length) {
      const current = new Date(acc[i].invoice_date ?? acc[i].issue_date ?? 0).getTime()
      if (stamp > current) break
      i += 1
    }
    if (i < 2) {
      acc.splice(i, 0, invoice)
      if (acc.length > 2) acc.pop()
    }
    return acc
  }, [])

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
            ({Intl.NumberFormat('pl-PL', { style: 'currency', currency: inv.currency }).format(inv.amount)})
          </span>
        </span>
      ),
    })
  }

  return items
    .slice(0, 4)
}

export function ActivitySection() {
  const { data } = useDashboardData()
  const { dateRange } = useDashboardRange()
  const filtered = useFilteredEntries(data.workEntries, dateRange)
  const totals = useDashboardTotals(filtered, data.clients)

  const clientsInPeriod = useMemo(
    () => new Set(filtered.map((e) => e.client_id).filter(Boolean)).size,
    [filtered],
  )

  const defaultClientsCount = useMemo(
    () => data.clients.filter((c) => c.is_default).length,
    [data.clients],
  )

  const activeJobs = useMemo(() => {
    const ids = new Set(filtered.map((e) => e.project_id).filter(Boolean))
    return ids.size
  }, [filtered])

  const totalJobs = useMemo(() => {
    const ids = new Set(data.workEntries.map((e) => e.project_id).filter(Boolean))
    return Math.max(activeJobs, ids.size)
  }, [data.workEntries, activeJobs])

  const feed = useMemo(
    () => buildFeed(data.workEntries, data.invoices, data.clients),
    [data.workEntries, data.invoices, data.clients],
  )

  const absences = totals.vacationDays + totals.sickDays

  return (
    <StatsErrorBoundary>
      <ActivityCard
        clientsCount={clientsInPeriod || data.clients.length}
        defaultClientsCount={defaultClientsCount}
        activeJobs={activeJobs}
        totalJobs={totalJobs || 0}
        absences={absences}
        feed={feed}
      />
    </StatsErrorBoundary>
  )
}
