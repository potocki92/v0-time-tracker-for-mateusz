import { describe, it, expect } from 'vitest'
import { sumInvoicesByCurrency } from '@/lib/finance/invoice-currency-totals'
import type { Invoice } from '@/lib/types'

function mkInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    client_id: 'c1',
    name: 'FV',
    issue_date: '2026-07-01',
    invoice_date: '2026-07-01',
    due_date: '2026-07-15',
    invoice_number: 'FV 1/07/2026',
    recipient: null,
    description: null,
    billing_period: null,
    amount: 1000,
    currency: 'PLN',
    is_paid: false,
    status: 'SENT',
    file_url: null,
    notes: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('sumInvoicesByCurrency', () => {
  it('keeps EUR and PLN apart instead of summing them into one number', () => {
    const totals = sumInvoicesByCurrency([
      mkInvoice({ currency: 'EUR', amount: 1400 }),
      mkInvoice({ currency: 'EUR', amount: 1624 }),
      mkInvoice({ currency: 'PLN', amount: 5800 }),
      mkInvoice({ currency: 'PLN', amount: 5800 }),
    ])

    expect(totals).toEqual([
      { currency: 'EUR', total: 3024, count: 2 },
      { currency: 'PLN', total: 11600, count: 2 },
    ])
    // 14624 was the mixed-currency total the dashboard used to display as EUR.
    expect(totals.map((t) => t.total)).not.toContain(14624)
  })

  it('returns a single entry when every invoice shares one currency', () => {
    const totals = sumInvoicesByCurrency([
      mkInvoice({ currency: 'EUR', amount: 100 }),
      mkInvoice({ currency: 'EUR', amount: 250.5 }),
    ])

    expect(totals).toEqual([{ currency: 'EUR', total: 350.5, count: 2 }])
  })

  it('returns an empty list for no invoices', () => {
    expect(sumInvoicesByCurrency([])).toEqual([])
  })

  it('treats a missing currency as PLN', () => {
    const totals = sumInvoicesByCurrency([
      mkInvoice({ currency: undefined as unknown as Invoice['currency'], amount: 200 }),
      mkInvoice({ currency: 'PLN', amount: 300 }),
    ])

    expect(totals).toEqual([{ currency: 'PLN', total: 500, count: 2 }])
  })

  it('sums exactly, without float drift', () => {
    const totals = sumInvoicesByCurrency([
      mkInvoice({ currency: 'PLN', amount: 0.1 }),
      mkInvoice({ currency: 'PLN', amount: 0.2 }),
    ])

    expect(totals[0].total).toBe(0.3)
  })

  it('orders currencies by first appearance in the input', () => {
    const totals = sumInvoicesByCurrency([
      mkInvoice({ currency: 'PLN', amount: 10 }),
      mkInvoice({ currency: 'EUR', amount: 20 }),
    ])

    expect(totals.map((t) => t.currency)).toEqual(['PLN', 'EUR'])
  })
})
