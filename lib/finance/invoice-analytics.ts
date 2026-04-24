import type { CURRENCY, Invoice } from '@/lib/types'
import { InvoiceStatus, deriveInvoiceStatus } from './invoice-status'
import { add, convert, fromDb, type Money, toMajor, zero } from './money'

export interface MonthlyRevenuePoint {
  /** ISO year-month, e.g. 2025-06. */
  month: string
  issued_pln: number
  paid_pln: number
  overdue_pln: number
}

export interface TopClient {
  client_id: string | null
  client_name: string
  revenue_pln: number
  invoice_count: number
}

export interface AnalyticsResult {
  totals: {
    issued: number
    paid: number
    unpaid: number
    overdue: number
    count: number
    paid_count: number
    overdue_count: number
  }
  dso: number
  monthlyRevenue: MonthlyRevenuePoint[]
  topClients: TopClient[]
  statusDistribution: Record<InvoiceStatus, number>
}

export interface InvoiceAnalyticsInput {
  invoices: Invoice[]
  /** Map of client_id → client name for top-client aggregation. */
  clientNames: Record<string, string>
  /** EUR→PLN conversion rate used for totals reporting. */
  eurRate: number
  /** Anchor date for OVERDUE derivation. Defaults to current time. */
  now?: Date
}

function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

function toPln(amount: number, currency: CURRENCY, eurRate: number): Money {
  const money = fromDb(amount, currency)
  return currency === 'PLN' ? money : convert(money, 'PLN', eurRate)
}

function daysBetween(a: string, b: string): number {
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta) || Number.isNaN(tb)) return 0
  return Math.round((tb - ta) / (1000 * 60 * 60 * 24))
}

export function calculateInvoiceAnalytics({
  invoices,
  clientNames,
  eurRate,
  now = new Date(),
}: InvoiceAnalyticsInput): AnalyticsResult {
  let issued = zero('PLN')
  let paid = zero('PLN')
  let unpaid = zero('PLN')
  let overdue = zero('PLN')

  let paidCount = 0
  let overdueCount = 0
  let dsoSum = 0
  let dsoCount = 0

  const monthlyAccumulator = new Map<
    string,
    { issued: Money; paid: Money; overdue: Money }
  >()

  const byClient = new Map<string, { name: string; revenue: Money; count: number }>()

  const statusDistribution: Record<InvoiceStatus, number> = {
    [InvoiceStatus.DRAFT]: 0,
    [InvoiceStatus.SENT]: 0,
    [InvoiceStatus.PAID]: 0,
    [InvoiceStatus.OVERDUE]: 0,
    [InvoiceStatus.CANCELLED]: 0,
  }

  for (const invoice of invoices) {
    const status = deriveInvoiceStatus(invoice, now)
    statusDistribution[status] = (statusDistribution[status] ?? 0) + 1

    if (status === InvoiceStatus.CANCELLED) continue

    const amountPln = toPln(Number(invoice.gross_amount ?? invoice.amount ?? 0), invoice.currency, eurRate)
    issued = add(issued, amountPln)

    if (status === InvoiceStatus.PAID) {
      paid = add(paid, amountPln)
      paidCount += 1
      if (invoice.invoice_date && invoice.paid_date) {
        dsoSum += daysBetween(invoice.invoice_date, invoice.paid_date)
        dsoCount += 1
      }
    } else if (status === InvoiceStatus.OVERDUE) {
      overdue = add(overdue, amountPln)
      unpaid = add(unpaid, amountPln)
      overdueCount += 1
    } else if (status === InvoiceStatus.SENT || status === InvoiceStatus.DRAFT) {
      unpaid = add(unpaid, amountPln)
    }

    const issueDate = invoice.invoice_date ?? invoice.issue_date ?? invoice.created_at
    if (issueDate) {
      const key = monthKey(issueDate)
      const bucket =
        monthlyAccumulator.get(key) ??
        { issued: zero('PLN'), paid: zero('PLN'), overdue: zero('PLN') }
      bucket.issued = add(bucket.issued, amountPln)
      if (status === InvoiceStatus.PAID) bucket.paid = add(bucket.paid, amountPln)
      if (status === InvoiceStatus.OVERDUE) bucket.overdue = add(bucket.overdue, amountPln)
      monthlyAccumulator.set(key, bucket)
    }

    const clientId = invoice.client_id ?? '_none_'
    const clientName = clientId === '_none_' ? 'Bez klienta' : clientNames[invoice.client_id ?? ''] ?? 'Nieznany klient'
    const current = byClient.get(clientId) ?? { name: clientName, revenue: zero('PLN'), count: 0 }
    current.revenue = add(current.revenue, amountPln)
    current.count += 1
    byClient.set(clientId, current)
  }

  const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(monthlyAccumulator.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, v]) => ({
      month,
      issued_pln: toMajor(v.issued),
      paid_pln: toMajor(v.paid),
      overdue_pln: toMajor(v.overdue),
    }))

  const topClients: TopClient[] = Array.from(byClient.entries())
    .map(([id, v]) => ({
      client_id: id === '_none_' ? null : id,
      client_name: v.name,
      revenue_pln: toMajor(v.revenue),
      invoice_count: v.count,
    }))
    .sort((a, b) => b.revenue_pln - a.revenue_pln)
    .slice(0, 5)

  return {
    totals: {
      issued: toMajor(issued),
      paid: toMajor(paid),
      unpaid: toMajor(unpaid),
      overdue: toMajor(overdue),
      count: invoices.length - statusDistribution[InvoiceStatus.CANCELLED],
      paid_count: paidCount,
      overdue_count: overdueCount,
    },
    dso: dsoCount > 0 ? Math.round((dsoSum / dsoCount) * 10) / 10 : 0,
    monthlyRevenue,
    topClients,
    statusDistribution,
  }
}
