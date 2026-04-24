import type { CURRENCY } from '@/lib/types'
import { type Money, add, fromMajor, multiply, toDb, toMajor, zero } from './money'

export interface LineItemTotalsInput {
  quantity: number
  unit_price_net: number
  vat_rate: number
}

export interface LineItemTotals {
  net: Money
  vat: Money
  gross: Money
}

export interface InvoiceTotals {
  net: Money
  vat: Money
  gross: Money
  /** Rounded NUMERIC(12,2) values ready to persist. */
  net_amount: number
  vat_amount: number
  gross_amount: number
}

/** Compute a single invoice line's totals in an exact, currency-aware way. */
export function computeLineItemTotals(
  line: LineItemTotalsInput,
  currency: CURRENCY,
): LineItemTotals {
  const unit = fromMajor(line.unit_price_net, currency)
  const net = multiply(unit, line.quantity)
  const vat = multiply(net, line.vat_rate / 100)
  const gross = add(net, vat)
  return { net, vat, gross }
}

/** Aggregate totals across all lines for an invoice. */
export function computeInvoiceTotals(
  lines: LineItemTotalsInput[],
  currency: CURRENCY,
): InvoiceTotals {
  let net = zero(currency)
  let vat = zero(currency)
  for (const line of lines) {
    const lineTotals = computeLineItemTotals(line, currency)
    net = add(net, lineTotals.net)
    vat = add(vat, lineTotals.vat)
  }
  const gross = add(net, vat)
  return {
    net,
    vat,
    gross,
    net_amount: toDb(net),
    vat_amount: toDb(vat),
    gross_amount: toDb(gross),
  }
}

/** Convenience helper mirroring what the DB trigger persists. */
export function sumLineItemGrossAsNumber(
  lines: LineItemTotalsInput[],
  currency: CURRENCY,
): number {
  return toMajor(computeInvoiceTotals(lines, currency).gross)
}
