import type { CURRENCY, Invoice } from '@/lib/types'
import { InvoiceStatus, deriveInvoiceStatus } from '@/lib/finance/invoice-status'

export interface InvoicePeriodSummary {
  total: number
  count: number
  sentCount: number
  prevTotal: number
  trendPercent: number | null
}

export interface InvoicePaidSummary {
  total: number
  paidCount: number
  totalCount: number
  avgDaysToPay: number | null
}

export interface InvoiceOutstandingSummary {
  total: number
  openCount: number
  overdueCount: number
}

export interface InvoiceDraftSummary {
  total: number
  count: number
}

export interface InvoiceAgingBuckets {
  current: number
  d1to15: number
  d16to30: number
  d30plus: number
  total: number
  invoiceCount: number
}

export interface CashflowMonth {
  monthIndex: number
  year: number
  label: string
  total: number
}

export interface InvoicesAggregateStats {
  currency: CURRENCY
  monthLabel: string
  cycleLabel: string
  period: InvoicePeriodSummary
  paid: InvoicePaidSummary
  outstanding: InvoiceOutstandingSummary
  drafts: InvoiceDraftSummary
  aging: InvoiceAgingBuckets
  cashflow: CashflowMonth[]
  cashflowTotal: number
  cashflowTrendPercent: number | null
  counts: {
    all: number
    open: number
    overdue: number
    paid: number
    drafts: number
  }
}

const POLISH_MONTHS_FULL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
] as const

const POLISH_MONTHS_SHORT = [
  'Sty',
  'Lut',
  'Mar',
  'Kwi',
  'Maj',
  'Cze',
  'Lip',
  'Sie',
  'Wrz',
  'Paź',
  'Lis',
  'Gru',
] as const

function polishMonthFull(monthIndex: number): string {
  return POLISH_MONTHS_FULL[monthIndex] ?? ''
}

export function polishMonthShort(monthIndex: number): string {
  return POLISH_MONTHS_SHORT[monthIndex] ?? ''
}

function quarterFromMonth(monthIndex: number): 1 | 2 | 3 | 4 {
  return (Math.floor(monthIndex / 3) + 1) as 1 | 2 | 3 | 4
}

function invoiceDate(inv: Invoice): Date | null {
  const raw = inv.invoice_date ?? inv.issue_date ?? inv.created_at ?? null
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function dueDate(inv: Invoice): Date | null {
  if (!inv.due_date) return null
  const d = new Date(inv.due_date)
  return Number.isNaN(d.getTime()) ? null : d
}

function paidDate(inv: Invoice): Date | null {
  if (!inv.paid_date) return null
  const d = new Date(inv.paid_date)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function trendPercent(curr: number, prev: number): number | null {
  if (prev <= 0) return curr > 0 ? 100 : null
  return Math.round(((curr - prev) / prev) * 100)
}

export function computeInvoicesStats(
  invoices: Invoice[],
  currency: CURRENCY,
  now: Date = new Date(),
): InvoicesAggregateStats {
  const monthIndex = now.getMonth()
  const year = now.getFullYear()
  const monthLabel = polishMonthFull(monthIndex).toUpperCase()
  const cycleLabel = `Q${quarterFromMonth(monthIndex)}`

  const onlyCurrency = invoices.filter((inv) => (inv.currency ?? 'PLN') === currency)

  const inMonth: Invoice[] = []
  const inPrevMonth: Invoice[] = []
  for (const inv of onlyCurrency) {
    const d = invoiceDate(inv)
    if (!d) continue
    if (d.getFullYear() === year && d.getMonth() === monthIndex) inMonth.push(inv)
    else if (
      (monthIndex === 0 && d.getFullYear() === year - 1 && d.getMonth() === 11) ||
      (monthIndex !== 0 && d.getFullYear() === year && d.getMonth() === monthIndex - 1)
    )
      inPrevMonth.push(inv)
  }

  const periodTotal = inMonth.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
  const periodPrevTotal = inPrevMonth.reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0)
  const sentCount = inMonth.filter(
    (inv) => deriveInvoiceStatus(inv, now) !== InvoiceStatus.DRAFT,
  ).length

  let paidTotal = 0
  let paidCount = 0
  let paidDaysSum = 0
  let paidDaysCount = 0
  for (const inv of inMonth) {
    if (inv.is_paid || deriveInvoiceStatus(inv, now) === InvoiceStatus.PAID) {
      paidTotal += Number(inv.amount ?? 0)
      paidCount += 1
      const issued = invoiceDate(inv)
      const paid = paidDate(inv)
      if (issued && paid) {
        paidDaysSum += daysBetween(paid, issued)
        paidDaysCount += 1
      }
    }
  }
  const avgDaysToPay = paidDaysCount > 0 ? paidDaysSum / paidDaysCount : null

  let outstandingTotal = 0
  let openCount = 0
  let overdueCount = 0
  let draftsTotal = 0
  let draftsCount = 0
  for (const inv of onlyCurrency) {
    const status = deriveInvoiceStatus(inv, now)
    if (status === InvoiceStatus.DRAFT) {
      draftsTotal += Number(inv.amount ?? 0)
      draftsCount += 1
    } else if (status === InvoiceStatus.SENT) {
      outstandingTotal += Number(inv.amount ?? 0)
      openCount += 1
    } else if (status === InvoiceStatus.OVERDUE) {
      outstandingTotal += Number(inv.amount ?? 0)
      overdueCount += 1
    }
  }

  let agingCurrent = 0
  let aging1to15 = 0
  let aging16to30 = 0
  let aging30plus = 0
  let agingInvoices = 0
  for (const inv of onlyCurrency) {
    const status = deriveInvoiceStatus(inv, now)
    if (status !== InvoiceStatus.SENT && status !== InvoiceStatus.OVERDUE) continue
    agingInvoices += 1
    const amount = Number(inv.amount ?? 0)
    const due = dueDate(inv)
    if (!due || due.getTime() >= now.getTime()) {
      agingCurrent += amount
      continue
    }
    const days = daysBetween(now, due)
    if (days <= 15) aging1to15 += amount
    else if (days <= 30) aging16to30 += amount
    else aging30plus += amount
  }

  const cashflowMonths: CashflowMonth[] = []
  for (let i = 5; i >= 0; i -= 1) {
    const ref = new Date(year, monthIndex - i, 1)
    const total = onlyCurrency.reduce((sum, inv) => {
      const d = invoiceDate(inv)
      if (!d) return sum
      if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth())
        return sum + Number(inv.amount ?? 0)
      return sum
    }, 0)
    cashflowMonths.push({
      monthIndex: ref.getMonth(),
      year: ref.getFullYear(),
      label: polishMonthShort(ref.getMonth()),
      total,
    })
  }
  const cashflowTotal = cashflowMonths.reduce((s, m) => s + m.total, 0)
  const firstHalf = cashflowMonths.slice(0, 3).reduce((s, m) => s + m.total, 0)
  const secondHalf = cashflowMonths.slice(3, 6).reduce((s, m) => s + m.total, 0)
  const cashflowTrendPercent = trendPercent(secondHalf, firstHalf)

  const counts = {
    all: onlyCurrency.length,
    open: 0,
    overdue: 0,
    paid: 0,
    drafts: 0,
  }
  for (const inv of onlyCurrency) {
    const status = deriveInvoiceStatus(inv, now)
    if (status === InvoiceStatus.PAID) counts.paid += 1
    else if (status === InvoiceStatus.OVERDUE) counts.overdue += 1
    else if (status === InvoiceStatus.DRAFT) counts.drafts += 1
    else if (status === InvoiceStatus.SENT) counts.open += 1
  }

  return {
    currency,
    monthLabel,
    cycleLabel,
    period: {
      total: periodTotal,
      count: inMonth.length,
      sentCount,
      prevTotal: periodPrevTotal,
      trendPercent: trendPercent(periodTotal, periodPrevTotal),
    },
    paid: {
      total: paidTotal,
      paidCount,
      totalCount: inMonth.length,
      avgDaysToPay,
    },
    outstanding: {
      total: outstandingTotal,
      openCount,
      overdueCount,
    },
    drafts: {
      total: draftsTotal,
      count: draftsCount,
    },
    aging: {
      current: agingCurrent,
      d1to15: aging1to15,
      d16to30: aging16to30,
      d30plus: aging30plus,
      total: agingCurrent + aging1to15 + aging16to30 + aging30plus,
      invoiceCount: agingInvoices,
    },
    cashflow: cashflowMonths,
    cashflowTotal,
    cashflowTrendPercent,
    counts,
  }
}

export type InvoiceFilterTab = 'all' | 'open' | 'overdue' | 'paid' | 'drafts'

export function filterInvoicesByTab(
  invoices: Invoice[],
  tab: InvoiceFilterTab,
  now: Date = new Date(),
): Invoice[] {
  if (tab === 'all') return invoices
  return invoices.filter((inv) => {
    const status = deriveInvoiceStatus(inv, now)
    if (tab === 'open') return status === InvoiceStatus.SENT
    if (tab === 'overdue') return status === InvoiceStatus.OVERDUE
    if (tab === 'paid') return status === InvoiceStatus.PAID
    if (tab === 'drafts') return status === InvoiceStatus.DRAFT
    return true
  })
}

export function searchInvoices(invoices: Invoice[], query: string): Invoice[] {
  const q = query.trim().toLowerCase()
  if (!q) return invoices
  return invoices.filter((inv) => {
    const number = (inv.invoice_number ?? '').toLowerCase()
    const name = (inv.name ?? '').toLowerCase()
    const recipient = (inv.recipient ?? '').toLowerCase()
    const period = (inv.billing_period ?? '').toLowerCase()
    const notes = (inv.notes ?? '').toLowerCase()
    return (
      number.includes(q) ||
      name.includes(q) ||
      recipient.includes(q) ||
      period.includes(q) ||
      notes.includes(q)
    )
  })
}
