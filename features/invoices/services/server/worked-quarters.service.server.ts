'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CURRENCY } from '@/lib/types'
import { calculateEntryMoney, fallbackFromClient } from '@/lib/finance/entry-calculations'
import { sum, toDb, zero } from '@/lib/finance/money'
import {
  type BillingQuarter,
  quarterDateRange,
  quarterFromMonthNumber,
} from '../../domain'

export interface WorkedQuarterSummary {
  /** Composite id `YYYY-Q#` for stable React keys and form values. */
  id: string
  year: number
  quarter: BillingQuarter
  /** Inclusive ISO date range covered by the quarter. */
  start: string
  end: string
  /** Total billable hours for `worked` entries in the quarter. */
  hours: number
  /** Total billable quantity (piecework). */
  quantity: number
  /** Gross amount in the client currency, in major units. */
  amount: number
  currency: CURRENCY
  workType: 'hourly' | 'piecework'
  workedDays: number
  hasRate: boolean
  /**
   * Whether at least one invoice already covers this quarter for this client
   * (matched by `billing_period == "Q# YYYY"` or by quarter-overlapping
   * `period_start`/`period_end`). Used by the dashboard to show "wystawiono"
   * vs "do wystawienia".
   */
  invoiced: boolean
  /** Optional reference to the matching invoice id. */
  invoiceId: string | null
}

interface FetchInput {
  clientId: string
  /** Number of past quarters (including current) to return. Default: 4. */
  count?: number
}

function _pad(n: number) {
  return String(n).padStart(2, '0')
}

function quarterIndex(year: number, quarter: BillingQuarter): number {
  return year * 4 + Number(quarter[1]) - 1
}

function quarterFromIndex(idx: number): { year: number; quarter: BillingQuarter } {
  const year = Math.floor(idx / 4)
  const q = (idx % 4) + 1
  return { year, quarter: `Q${q}` as BillingQuarter }
}

/**
 * Aggregate `work_entries` by calendar quarter for a single client and overlay
 * invoice coverage so the UI can flag which quarters still need to be billed.
 *
 * Returned in reverse chronological order (newest first).
 */
export async function getWorkedQuartersForClient({
  clientId,
  count = 4,
}: FetchInput): Promise<WorkedQuarterSummary[]> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentQuarter = quarterFromMonthNumber(now.getUTCMonth() + 1)
  const endIdx = quarterIndex(currentYear, currentQuarter)
  const startIdx = endIdx - (count - 1)
  const oldest = quarterFromIndex(startIdx)
  const newest = quarterFromIndex(endIdx)
  const oldestRange = quarterDateRange(oldest.year, oldest.quarter)
  const newestRange = quarterDateRange(newest.year, newest.quarter)

  const [clientRes, entriesRes, invoicesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, rate, currency, work_type')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('work_entries')
      .select('date, status, hours, quantity, quantity_from, quantity_to, billing_rate, billing_currency, billing_work_type')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .eq('status', 'worked')
      .gte('date', oldestRange.start)
      .lte('date', newestRange.end)
      .order('date', { ascending: true }),
    supabase
      .from('invoices')
      .select('id, billing_period, period_start, period_end')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .or(`period_end.gte.${oldestRange.start},billing_period.is.not.null`),
  ])

  if (clientRes.error) throw new Error(clientRes.error.message)
  if (entriesRes.error) throw new Error(entriesRes.error.message)
  if (invoicesRes.error) throw new Error(invoicesRes.error.message)
  if (!clientRes.data) return []

  const fallback = fallbackFromClient({
    rate: Number(clientRes.data.rate ?? 0),
    currency: (clientRes.data.currency ?? 'PLN') as CURRENCY,
    work_type: clientRes.data.work_type === 'piecework' ? 'piecework' : 'hourly',
  })

  // Pre-seed buckets for every requested quarter so empty quarters still show up.
  const buckets = new Map<string, WorkedQuarterSummary & { _moneys: ReturnType<typeof calculateEntryMoney>[] }>()
  for (let i = startIdx; i <= endIdx; i += 1) {
    const { year, quarter } = quarterFromIndex(i)
    const range = quarterDateRange(year, quarter)
    const id = `${year}-${quarter}`
    buckets.set(id, {
      id,
      year,
      quarter,
      start: range.start,
      end: range.end,
      hours: 0,
      quantity: 0,
      amount: 0,
      currency: fallback.currency,
      workType: fallback.workType,
      workedDays: 0,
      hasRate: false,
      invoiced: false,
      invoiceId: null,
      _moneys: [],
    })
  }

  for (const entry of entriesRes.data ?? []) {
    const dateStr = entry.date as string
    const month = Number(dateStr.slice(5, 7))
    const year = Number(dateStr.slice(0, 4))
    const quarter = quarterFromMonthNumber(month)
    const id = `${year}-${quarter}`
    const bucket = buckets.get(id)
    if (!bucket) continue

    const hours = Number(entry.hours ?? 0)
    const qty = Number(
      entry.quantity ??
        (entry.quantity_from != null && entry.quantity_to != null
          ? Number(entry.quantity_to) - Number(entry.quantity_from)
          : 0),
    )
    bucket.hours += Number.isFinite(hours) ? hours : 0
    bucket.quantity += Number.isFinite(qty) && qty > 0 ? qty : 0
    bucket.workedDays += 1

    const money = calculateEntryMoney(entry as never, fallback)
    bucket._moneys.push(money)
    if (entry.billing_currency) bucket.currency = entry.billing_currency as CURRENCY
    if (entry.billing_work_type) {
      bucket.workType = entry.billing_work_type === 'piecework' ? 'piecework' : 'hourly'
    }
  }

  // Match invoices to their quarter. Two strategies:
  //  1) `billing_period` literally equals `Q# YYYY` (the manual / builder path).
  //  2) `period_start`/`period_end` overlap the quarter's calendar range.
  for (const inv of invoicesRes.data ?? []) {
    const labelMatch = (inv.billing_period as string | null)?.match(/(Q[1-4])\s+(\d{4})/)
    if (labelMatch) {
      const id = `${labelMatch[2]}-${labelMatch[1]}`
      const bucket = buckets.get(id)
      if (bucket && !bucket.invoiced) {
        bucket.invoiced = true
        bucket.invoiceId = inv.id as string
      }
      continue
    }
    const ps = inv.period_start as string | null
    const pe = inv.period_end as string | null
    if (!ps && !pe) continue
    for (const bucket of buckets.values()) {
      if (bucket.invoiced) continue
      const startsBeforeEnd = !ps || ps <= bucket.end
      const endsAfterStart = !pe || pe >= bucket.start
      if (startsBeforeEnd && endsAfterStart) {
        bucket.invoiced = true
        bucket.invoiceId = inv.id as string
      }
    }
  }

  const summaries: WorkedQuarterSummary[] = []
  for (const bucket of buckets.values()) {
    const moneys = bucket._moneys.filter((m) => m.currency === bucket.currency)
    const total = moneys.length > 0 ? sum(moneys, bucket.currency) : zero(bucket.currency)
    const amountDb = toDb(total)
    summaries.push({
      id: bucket.id,
      year: bucket.year,
      quarter: bucket.quarter,
      start: bucket.start,
      end: bucket.end,
      hours: Math.round(bucket.hours * 100) / 100,
      quantity: Math.round(bucket.quantity * 1000) / 1000,
      amount: amountDb,
      currency: bucket.currency,
      workType: bucket.workType,
      workedDays: bucket.workedDays,
      hasRate: amountDb > 0,
      invoiced: bucket.invoiced,
      invoiceId: bucket.invoiceId,
    })
  }

  // Newest first.
  summaries.sort((a, b) => quarterIndex(b.year, b.quarter) - quarterIndex(a.year, a.quarter))
  return summaries
}

export interface OverallQuarterSummary {
  year: number
  quarter: BillingQuarter
  id: string
  start: string
  end: string
  hours: number
  workedDays: number
  /** Total earnings expressed in PLN (mixing PLN entries directly + EUR via snapshot). */
  earningsPLN: number
  /** Total earnings expressed in EUR (only EUR entries). */
  earningsEUR: number
  invoiceCount: number
  invoicedAmountPLN: number
  invoicedAmountEUR: number
  /** True if at least one invoice for this user overlaps the quarter. */
  invoiced: boolean
}

/**
 * User-wide quarterly aggregate (across all clients) used by the dashboard
 * "Kwartały" card. Always returns `count` quarters ending with the current one.
 */
export async function getOverallQuarterSummaries(count = 4): Promise<OverallQuarterSummary[]> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentQuarter = quarterFromMonthNumber(now.getUTCMonth() + 1)
  const endIdx = quarterIndex(currentYear, currentQuarter)
  const startIdx = endIdx - (count - 1)
  const oldest = quarterFromIndex(startIdx)
  const newest = quarterFromIndex(endIdx)
  const oldestRange = quarterDateRange(oldest.year, oldest.quarter)
  const newestRange = quarterDateRange(newest.year, newest.quarter)

  const [clientsRes, entriesRes, invoicesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, rate, currency, work_type')
      .eq('user_id', user.id),
    supabase
      .from('work_entries')
      .select('date, status, hours, quantity, quantity_from, quantity_to, billing_rate, billing_currency, billing_work_type, client_id')
      .eq('user_id', user.id)
      .eq('status', 'worked')
      .gte('date', oldestRange.start)
      .lte('date', newestRange.end),
    supabase
      .from('invoices')
      .select('id, amount, currency, billing_period, period_start, period_end, invoice_date, status')
      .eq('user_id', user.id),
  ])

  if (clientsRes.error) throw new Error(clientsRes.error.message)
  if (entriesRes.error) throw new Error(entriesRes.error.message)
  if (invoicesRes.error) throw new Error(invoicesRes.error.message)

  const clientFallbacks = new Map<string, ReturnType<typeof fallbackFromClient>>()
  for (const client of clientsRes.data ?? []) {
    clientFallbacks.set(
      client.id as string,
      fallbackFromClient({
        rate: Number(client.rate ?? 0),
        currency: (client.currency ?? 'PLN') as CURRENCY,
        work_type: client.work_type === 'piecework' ? 'piecework' : 'hourly',
      }),
    )
  }
  const defaultFallback = { rate: 0, currency: 'PLN' as CURRENCY, workType: 'hourly' as const }

  const buckets = new Map<string, OverallQuarterSummary & { _pln: ReturnType<typeof calculateEntryMoney>[]; _eur: ReturnType<typeof calculateEntryMoney>[] }>()
  for (let i = startIdx; i <= endIdx; i += 1) {
    const { year, quarter } = quarterFromIndex(i)
    const range = quarterDateRange(year, quarter)
    const id = `${year}-${quarter}`
    buckets.set(id, {
      id,
      year,
      quarter,
      start: range.start,
      end: range.end,
      hours: 0,
      workedDays: 0,
      earningsPLN: 0,
      earningsEUR: 0,
      invoiceCount: 0,
      invoicedAmountPLN: 0,
      invoicedAmountEUR: 0,
      invoiced: false,
      _pln: [],
      _eur: [],
    })
  }

  for (const entry of entriesRes.data ?? []) {
    const dateStr = entry.date as string
    const year = Number(dateStr.slice(0, 4))
    const month = Number(dateStr.slice(5, 7))
    const quarter = quarterFromMonthNumber(month)
    const id = `${year}-${quarter}`
    const bucket = buckets.get(id)
    if (!bucket) continue

    bucket.hours += Number(entry.hours ?? 0)
    bucket.workedDays += 1

    const fallback = clientFallbacks.get(entry.client_id as string) ?? defaultFallback
    const money = calculateEntryMoney(entry as never, fallback)
    if (money.currency === 'EUR') bucket._eur.push(money)
    else bucket._pln.push(money)
  }

  for (const inv of invoicesRes.data ?? []) {
    if (inv.status === 'CANCELLED') continue

    let matched = false
    const labelMatch = (inv.billing_period as string | null)?.match(/(Q[1-4])\s+(\d{4})/)
    if (labelMatch) {
      const id = `${labelMatch[2]}-${labelMatch[1]}`
      const bucket = buckets.get(id)
      if (bucket) {
        bucket.invoiceCount += 1
        bucket.invoiced = true
        if ((inv.currency ?? 'PLN') === 'EUR') bucket.invoicedAmountEUR += Number(inv.amount ?? 0)
        else bucket.invoicedAmountPLN += Number(inv.amount ?? 0)
        matched = true
      }
    }

    if (matched) continue

    const ps = (inv.period_start as string | null) ?? (inv.invoice_date as string | null) ?? null
    const pe = (inv.period_end as string | null) ?? (inv.invoice_date as string | null) ?? null
    if (!ps && !pe) continue

    for (const bucket of buckets.values()) {
      const startsBeforeEnd = !ps || ps <= bucket.end
      const endsAfterStart = !pe || pe >= bucket.start
      if (startsBeforeEnd && endsAfterStart) {
        bucket.invoiceCount += 1
        bucket.invoiced = true
        if ((inv.currency ?? 'PLN') === 'EUR') bucket.invoicedAmountEUR += Number(inv.amount ?? 0)
        else bucket.invoicedAmountPLN += Number(inv.amount ?? 0)
        break
      }
    }
  }

  const result: OverallQuarterSummary[] = []
  for (const bucket of buckets.values()) {
    const plnTotal = bucket._pln.length > 0 ? sum(bucket._pln, 'PLN') : zero('PLN')
    const eurTotal = bucket._eur.length > 0 ? sum(bucket._eur, 'EUR') : zero('EUR')
    const { _pln: _p, _eur: _e, ...rest } = bucket
    result.push({
      ...rest,
      hours: Math.round(bucket.hours * 100) / 100,
      earningsPLN: toDb(plnTotal),
      earningsEUR: toDb(eurTotal),
    })
  }

  result.sort((a, b) => quarterIndex(b.year, b.quarter) - quarterIndex(a.year, a.quarter))
  return result
}
