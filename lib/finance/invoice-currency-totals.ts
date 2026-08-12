import type { CURRENCY, Invoice } from '@/lib/types'
import { add, fromDb, toMajor, zero, type Money } from './money'

export interface CurrencyTotal {
  currency: CURRENCY
  total: number
  count: number
}

const DEFAULT_CURRENCY: CURRENCY = 'PLN'

/**
 * Sumuje faktury osobno w każdej walucie — bez przeliczania kursem.
 *
 * Mieszanie PLN i EUR w jednej liczbie daje kwotę, która nie istnieje, dlatego
 * każda waluta ma własny wpis. Zwracane są tylko waluty faktycznie obecne
 * w danych, w kolejności pierwszego wystąpienia w tablicy wejściowej.
 */
export function sumInvoicesByCurrency(invoices: Invoice[]): CurrencyTotal[] {
  const buckets = new Map<CURRENCY, { money: Money; count: number }>()

  for (const invoice of invoices) {
    const currency = (invoice.currency ?? DEFAULT_CURRENCY) as CURRENCY
    const bucket = buckets.get(currency) ?? { money: zero(currency), count: 0 }
    bucket.money = add(bucket.money, fromDb(invoice.amount, currency))
    bucket.count += 1
    buckets.set(currency, bucket)
  }

  return Array.from(buckets.entries()).map(([currency, bucket]) => ({
    currency,
    total: toMajor(bucket.money),
    count: bucket.count,
  }))
}
