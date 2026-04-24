import type { Client, CURRENCY, WorkEntry } from '@/lib/types'
import { type Money, fromMajor, multiply, sum, zero } from './money'
import { resolveQuantity } from './quantity'

export type BillingWorkType = 'hourly' | 'piecework'

export interface EntryCalculationFallback {
  rate: number
  currency: CURRENCY
  workType: BillingWorkType
}

/** Normalize the minimum shape we need from a work entry. */
type CalculableEntry = Pick<
  WorkEntry,
  | 'status'
  | 'hours'
  | 'quantity'
  | 'quantity_from'
  | 'quantity_to'
  | 'billing_rate'
  | 'billing_currency'
  | 'billing_work_type'
>

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function resolveAppliedRate(entry: CalculableEntry, fallback: EntryCalculationFallback): number {
  const value = entry.billing_rate ?? fallback.rate ?? 0
  const rate = toFiniteNumber(value, 0)
  return rate > 0 ? rate : 0
}

export function resolveAppliedCurrency(
  entry: CalculableEntry,
  fallback: EntryCalculationFallback,
): CURRENCY {
  return (entry.billing_currency ?? fallback.currency ?? 'PLN') as CURRENCY
}

export function resolveAppliedWorkType(
  entry: CalculableEntry,
  fallback: EntryCalculationFallback,
): BillingWorkType {
  return (entry.billing_work_type ?? fallback.workType ?? 'hourly') as BillingWorkType
}

/**
 * Calculate the earnings for a single work entry as Money (precise, no float errors).
 * Returns zero-money when the entry was not worked, has no rate, or has no billable units.
 */
export function calculateEntryMoney(
  entry: CalculableEntry,
  fallback: EntryCalculationFallback,
): Money {
  if (entry.status !== 'worked') {
    return zero(resolveAppliedCurrency(entry, fallback))
  }

  const rate = resolveAppliedRate(entry, fallback)
  const currency = resolveAppliedCurrency(entry, fallback)
  if (rate <= 0) return zero(currency)

  const workType = resolveAppliedWorkType(entry, fallback)

  if (workType === 'piecework') {
    // resolveQuantity expects a full WorkEntry — we only use quantity-ish fields.
    const qty = resolveQuantity({
      quantity: entry.quantity,
      quantity_from: entry.quantity_from,
      quantity_to: entry.quantity_to,
    } as WorkEntry)
    if (!Number.isFinite(qty) || qty <= 0) return zero(currency)
    return multiply(fromMajor(rate, currency), qty)
  }

  const hours = toFiniteNumber(entry.hours, 0)
  if (hours <= 0) return zero(currency)
  return multiply(fromMajor(rate, currency), hours)
}

/** Sum many entries (per-currency). Entries with different currencies are bucketed separately. */
export function sumEntriesByCurrency(
  entries: CalculableEntry[],
  fallback: EntryCalculationFallback,
): { PLN: Money; EUR: Money } {
  const pln: Money[] = []
  const eur: Money[] = []
  for (const entry of entries) {
    const money = calculateEntryMoney(entry, fallback)
    if (money.currency === 'EUR') eur.push(money)
    else pln.push(money)
  }
  return {
    PLN: sum(pln, 'PLN'),
    EUR: sum(eur, 'EUR'),
  }
}

/** Helper used by the invoice auto-issue flow where we already have a client as the fallback source. */
export function fallbackFromClient(client: Pick<Client, 'rate' | 'currency' | 'work_type'>): EntryCalculationFallback {
  return {
    rate: toFiniteNumber(client.rate, 0),
    currency: (client.currency ?? 'PLN') as CURRENCY,
    workType: client.work_type === 'piecework' ? 'piecework' : 'hourly',
  }
}
