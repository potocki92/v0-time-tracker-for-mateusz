'use server'

import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CURRENCY } from '@/lib/types'
import { calculateEntryMoney, fallbackFromClient } from '@/lib/finance/entry-calculations'
import { sum, toDb, zero } from '@/lib/finance/money'

export interface WorkedWeekSummary {
  /** Week id, format `YYYY-W##` (ISO week). */
  id: string
  /** Monday of the week (YYYY-MM-DD). */
  start: string
  /** Sunday of the week (YYYY-MM-DD). */
  end: string
  /** Total billable hours across `worked` entries. */
  hours: number
  /** Total billable quantity (piecework). */
  quantity: number
  /** Total gross amount in the client currency, in major units. */
  amount: number
  /** Currency that matches the client's billing currency. */
  currency: CURRENCY
  /** Work type used by the client at the time of the entries. */
  workType: 'hourly' | 'piecework'
  /** Number of `worked` days in the week. */
  workedDays: number
  /** Whether the client has a positive billable rate for this week. */
  hasRate: boolean
}

interface FetchWorkedWeeksParams {
  clientId: string
  from?: string
  to?: string
}

function pad(num: number) {
  return String(num).padStart(2, '0')
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/**
 * ISO 8601 week-numbering: Monday is the first day, week 1 contains the
 * first Thursday of the year. Returns `{ year, week }` where `year` is the
 * ISO week-numbering year (which can differ from the calendar year on the
 * boundary, e.g. 2025-12-29 is 2026-W01).
 */
function isoWeekParts(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

function isoWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - (day - 1))
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return { start, end }
}

function defaultRange(): { from: string; to: string } {
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const from = new Date(todayUtc)
  from.setUTCDate(todayUtc.getUTCDate() - 90)
  return { from: toIsoDate(from), to: toIsoDate(todayUtc) }
}

/**
 * Aggregate `work_entries` for one client into ISO weeks suitable for the
 * invoice line-item picker. Only weeks that have at least one `worked` entry
 * are returned. Hours/amounts use the snapshot stored on each entry, falling
 * back to the client's current billing config when the snapshot is missing.
 */
export async function getWorkedWeeksForClient({
  clientId,
  from,
  to,
}: FetchWorkedWeeksParams): Promise<WorkedWeekSummary[]> {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const range = from && to ? { from, to } : defaultRange()

  const [clientRes, entriesRes] = await Promise.all([
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
      .gte('date', range.from)
      .lte('date', range.to)
      .order('date', { ascending: true }),
  ])

  if (clientRes.error) throw new Error(clientRes.error.message)
  if (entriesRes.error) throw new Error(entriesRes.error.message)
  if (!clientRes.data) return []

  const fallback = fallbackFromClient({
    rate: Number(clientRes.data.rate ?? 0),
    currency: (clientRes.data.currency ?? 'PLN') as CURRENCY,
    work_type: clientRes.data.work_type === 'piecework' ? 'piecework' : 'hourly',
  })

  const buckets = new Map<string, WorkedWeekSummary & { _moneys: ReturnType<typeof calculateEntryMoney>[] }>()

  for (const entry of entriesRes.data ?? []) {
    const dateUtc = parseIsoDateUtc(entry.date as string)
    const { year, week } = isoWeekParts(dateUtc)
    const id = `${year}-W${pad(week)}`

    let bucket = buckets.get(id)
    if (!bucket) {
      const { start, end } = isoWeekRange(dateUtc)
      bucket = {
        id,
        start: toIsoDate(start),
        end: toIsoDate(end),
        hours: 0,
        quantity: 0,
        amount: 0,
        currency: fallback.currency,
        workType: fallback.workType,
        workedDays: 0,
        hasRate: false,
        _moneys: [],
      }
      buckets.set(id, bucket)
    }

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

  const summaries: WorkedWeekSummary[] = []
  for (const bucket of buckets.values()) {
    const moneys = bucket._moneys.filter((m) => m.currency === bucket.currency)
    const total = moneys.length > 0 ? sum(moneys, bucket.currency) : zero(bucket.currency)
    summaries.push({
      id: bucket.id,
      start: bucket.start,
      end: bucket.end,
      hours: Math.round(bucket.hours * 100) / 100,
      quantity: Math.round(bucket.quantity * 1000) / 1000,
      amount: toDb(total),
      currency: bucket.currency,
      workType: bucket.workType,
      workedDays: bucket.workedDays,
      hasRate: toDb(total) > 0,
    })
  }

  summaries.sort((a, b) => (a.start < b.start ? 1 : a.start > b.start ? -1 : 0))
  return summaries
}
