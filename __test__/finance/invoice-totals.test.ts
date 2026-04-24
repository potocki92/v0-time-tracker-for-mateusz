import { describe, it, expect } from 'vitest'
import {
  computeInvoiceTotals,
  computeLineItemTotals,
  sumLineItemGrossAsNumber,
} from '@/lib/finance/invoice-totals'
import { toMajor } from '@/lib/finance/money'

describe('computeLineItemTotals', () => {
  it('computes net, vat and gross for 23%', () => {
    const result = computeLineItemTotals(
      { quantity: 2, unit_price_net: 100, vat_rate: 23 },
      'PLN',
    )
    expect(toMajor(result.net)).toBe(200)
    expect(toMajor(result.vat)).toBe(46)
    expect(toMajor(result.gross)).toBe(246)
  })

  it('handles fractional quantity and unit price precisely', () => {
    const result = computeLineItemTotals(
      { quantity: 1.5, unit_price_net: 199.99, vat_rate: 8 },
      'PLN',
    )
    // 1.5 * 199.99 = 299.985 -> 299.99 (net)
    // 299.99 * 0.08 = 23.9992 -> 24.00 (vat)
    expect(toMajor(result.net)).toBe(299.99)
    expect(toMajor(result.vat)).toBe(24)
    expect(toMajor(result.gross)).toBe(323.99)
  })

  it('handles 0% VAT', () => {
    const r = computeLineItemTotals({ quantity: 1, unit_price_net: 500, vat_rate: 0 }, 'EUR')
    expect(toMajor(r.net)).toBe(500)
    expect(toMajor(r.vat)).toBe(0)
    expect(toMajor(r.gross)).toBe(500)
  })

  it('preserves the currency', () => {
    const r = computeLineItemTotals({ quantity: 1, unit_price_net: 10, vat_rate: 23 }, 'EUR')
    expect(r.net.currency).toBe('EUR')
    expect(r.vat.currency).toBe('EUR')
    expect(r.gross.currency).toBe('EUR')
  })
})

describe('computeInvoiceTotals', () => {
  it('aggregates multiple lines and exposes NUMERIC(12,2)-ready numbers', () => {
    const totals = computeInvoiceTotals(
      [
        { quantity: 10, unit_price_net: 150, vat_rate: 23 },
        { quantity: 1, unit_price_net: 500, vat_rate: 8 },
        { quantity: 3, unit_price_net: 49.99, vat_rate: 23 },
      ],
      'PLN',
    )
    // line 1: net 1500, vat 345, gross 1845
    // line 2: net 500, vat 40, gross 540
    // line 3: net 149.97, vat 34.49, gross 184.46
    expect(totals.net_amount).toBe(2149.97)
    expect(totals.vat_amount).toBe(419.49)
    expect(totals.gross_amount).toBe(2569.46)
  })

  it('returns zero totals for an empty invoice', () => {
    const totals = computeInvoiceTotals([], 'PLN')
    expect(totals.net_amount).toBe(0)
    expect(totals.vat_amount).toBe(0)
    expect(totals.gross_amount).toBe(0)
  })

  it('classic 0.1+0.2 style sum stays exact', () => {
    const totals = computeInvoiceTotals(
      [
        { quantity: 1, unit_price_net: 0.1, vat_rate: 0 },
        { quantity: 1, unit_price_net: 0.2, vat_rate: 0 },
      ],
      'PLN',
    )
    expect(totals.gross_amount).toBe(0.3)
  })
})

describe('sumLineItemGrossAsNumber', () => {
  it('matches computeInvoiceTotals.gross_amount', () => {
    const lines = [
      { quantity: 2, unit_price_net: 100, vat_rate: 23 },
      { quantity: 1.5, unit_price_net: 60, vat_rate: 8 },
    ]
    expect(sumLineItemGrossAsNumber(lines, 'PLN')).toBe(
      computeInvoiceTotals(lines, 'PLN').gross_amount,
    )
  })
})
