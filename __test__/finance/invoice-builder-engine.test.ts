import { describe, expect, it } from 'vitest'
import {
  computeInvoiceTotals,
  computeLineTotals,
  formatMoney,
  resolveVatRate,
  toMajor,
} from '@/lib/finance/invoice-builder-engine'
import type { LineItemInput } from '@/lib/schemas/invoice-builder.schema'

function line(overrides: Partial<LineItemInput> = {}): LineItemInput {
  return {
    id: overrides.id ?? `line_${Math.random().toString(36).slice(2, 8)}`,
    description: 'item',
    unit: 'szt.',
    quantity: 1,
    unit_price_net: 100,
    vat_mode: 'standard',
    vat_rate: 23,
    ...overrides,
  }
}

describe('computeLineTotals', () => {
  it('computes net, vat and gross for the standard 23% rate', () => {
    const result = computeLineTotals(
      { quantity: 2, unit_price_net: 100, vat_mode: 'standard', vat_rate: 23 },
      'PLN',
    )
    expect(toMajor(result.net)).toBe(200)
    expect(toMajor(result.vat)).toBe(46)
    expect(toMajor(result.gross)).toBe(246)
  })

  it('handles fractional quantity and unit price without losing groszy', () => {
    const result = computeLineTotals(
      { quantity: 1.5, unit_price_net: 199.99, vat_mode: 'standard', vat_rate: 8 },
      'PLN',
    )
    // 1.5 * 199.99 = 299.985 -> rounds half-away-from-zero to 299.99
    // 299.99 * 0.08 = 23.9992  -> rounds to 24.00
    expect(toMajor(result.net)).toBe(299.99)
    expect(toMajor(result.vat)).toBe(24)
    expect(toMajor(result.gross)).toBe(323.99)
  })

  it('treats reverse charge as a zero-VAT line', () => {
    const result = computeLineTotals(
      { quantity: 10, unit_price_net: 50, vat_mode: 'rc', vat_rate: 23 },
      'EUR',
    )
    expect(toMajor(result.net)).toBe(500)
    expect(toMajor(result.vat)).toBe(0)
    expect(toMajor(result.gross)).toBe(500)
    expect(result.effective_vat_rate).toBe(0)
  })

  it('treats zw and np modes as zero-VAT regardless of vat_rate', () => {
    const zw = computeLineTotals(
      { quantity: 1, unit_price_net: 100, vat_mode: 'zw', vat_rate: 23 },
      'PLN',
    )
    const np = computeLineTotals(
      { quantity: 1, unit_price_net: 100, vat_mode: 'np', vat_rate: 23 },
      'PLN',
    )
    expect(toMajor(zw.vat)).toBe(0)
    expect(toMajor(np.vat)).toBe(0)
    expect(toMajor(zw.gross)).toBe(100)
    expect(toMajor(np.gross)).toBe(100)
  })

  it('returns zero on non-finite inputs instead of throwing', () => {
    const result = computeLineTotals(
      { quantity: Number.NaN, unit_price_net: Number.POSITIVE_INFINITY, vat_mode: 'standard', vat_rate: 23 },
      'PLN',
    )
    expect(toMajor(result.net)).toBe(0)
    expect(toMajor(result.gross)).toBe(0)
  })
})

describe('computeInvoiceTotals — VAT bucket aggregation', () => {
  it('groups multiple lines by VAT bucket', () => {
    const result = computeInvoiceTotals({
      currency: 'PLN',
      items: [
        line({ quantity: 1, unit_price_net: 100, vat_rate: 23 }),
        line({ quantity: 1, unit_price_net: 200, vat_rate: 23 }),
        line({ quantity: 1, unit_price_net: 50, vat_rate: 8 }),
        line({ quantity: 1, unit_price_net: 100, vat_mode: 'rc' }),
      ],
    })
    expect(result.vat_breakdown).toHaveLength(3)
    const standard23 = result.vat_breakdown.find((b) => b.mode === 'standard' && b.rate === 23)
    const standard8 = result.vat_breakdown.find((b) => b.mode === 'standard' && b.rate === 8)
    const rc = result.vat_breakdown.find((b) => b.mode === 'rc')
    expect(standard23 && toMajor(standard23.net)).toBe(300)
    expect(standard23 && toMajor(standard23.vat)).toBe(69)
    expect(standard8 && toMajor(standard8.vat)).toBe(4)
    expect(rc && toMajor(rc.net)).toBe(100)
    expect(rc && toMajor(rc.vat)).toBe(0)
    expect(result.has_special_vat).toBe(true)
  })

  it('orders standard rates ascending, special modes last', () => {
    const result = computeInvoiceTotals({
      currency: 'PLN',
      items: [
        line({ vat_mode: 'rc' }),
        line({ vat_rate: 23 }),
        line({ vat_rate: 5 }),
      ],
    })
    expect(result.vat_breakdown.map((b) => `${b.mode}:${b.rate}`)).toEqual([
      'standard:5',
      'standard:23',
      'rc:0',
    ])
  })

  it('computes a PLN equivalent only when currency is foreign and exchange_rate is supplied', () => {
    const eurInvoice = computeInvoiceTotals({
      currency: 'EUR',
      exchange_rate: 4.3,
      items: [line({ quantity: 1, unit_price_net: 100, vat_rate: 23 })],
    })
    expect(eurInvoice.gross_in_pln).toBeDefined()
    // 100 + 23 = 123 EUR * 4.3 = 528.90 PLN
    expect(eurInvoice.gross_in_pln && toMajor(eurInvoice.gross_in_pln)).toBe(528.9)

    const plnInvoice = computeInvoiceTotals({
      currency: 'PLN',
      exchange_rate: 4.3,
      items: [line()],
    })
    expect(plnInvoice.gross_in_pln).toBeUndefined()

    const eurNoRate = computeInvoiceTotals({
      currency: 'EUR',
      items: [line()],
    })
    expect(eurNoRate.gross_in_pln).toBeUndefined()
  })

  it('returns zeroed totals (no breakdown) when items is empty', () => {
    const result = computeInvoiceTotals({ currency: 'PLN', items: [] })
    expect(toMajor(result.net)).toBe(0)
    expect(toMajor(result.vat)).toBe(0)
    expect(toMajor(result.gross)).toBe(0)
    expect(result.vat_breakdown).toEqual([])
    expect(result.has_special_vat).toBe(false)
  })
})

describe('resolveVatRate', () => {
  it('returns the numeric rate for standard mode', () => {
    expect(resolveVatRate({ vat_mode: 'standard', vat_rate: 19 })).toBe(19)
  })
  it('returns 0 for special modes regardless of stored rate', () => {
    expect(resolveVatRate({ vat_mode: 'zw', vat_rate: 23 })).toBe(0)
    expect(resolveVatRate({ vat_mode: 'np', vat_rate: 23 })).toBe(0)
    expect(resolveVatRate({ vat_mode: 'rc', vat_rate: 23 })).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats according to the currency', () => {
    const totals = computeInvoiceTotals({
      currency: 'EUR',
      items: [line({ quantity: 1, unit_price_net: 100, vat_rate: 23 })],
    })
    expect(formatMoney(totals.gross)).toMatch(/123,00/) // pl-PL formatting
    expect(formatMoney(totals.gross)).toMatch(/€/)
  })
})
