import { describe, it, expect } from 'vitest'
import { calculateInvoiceAnalytics } from '@/lib/finance/invoice-analytics'
import type { Invoice } from '@/lib/types'

const NOW = new Date('2025-06-15T12:00:00Z')

function mkInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'u1',
    client_id: 'c1',
    name: 'FV',
    issue_date: '2025-05-01',
    invoice_date: '2025-05-01',
    due_date: '2025-05-15',
    invoice_number: 'FV 1/05/2025',
    recipient: null,
    description: null,
    billing_period: null,
    amount: 1000,
    currency: 'PLN',
    is_paid: false,
    status: 'SENT',
    file_url: null,
    notes: null,
    created_at: '2025-05-01T00:00:00Z',
    ...overrides,
  }
}

const clientNames = { c1: 'ACME', c2: 'Globex' }

describe('calculateInvoiceAnalytics', () => {
  it('counts issued, paid, unpaid and overdue in PLN', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [
        mkInvoice({ status: 'PAID', is_paid: true, amount: 1000, paid_date: '2025-05-20' }),
        mkInvoice({ status: 'SENT', amount: 500, due_date: '2025-06-30' }),
        mkInvoice({ status: 'OVERDUE', amount: 300, due_date: '2025-05-01' }),
      ],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.totals.issued).toBe(1800)
    expect(result.totals.paid).toBe(1000)
    expect(result.totals.unpaid).toBe(800)
    expect(result.totals.overdue).toBe(300)
    expect(result.totals.count).toBe(3)
    expect(result.totals.paid_count).toBe(1)
    expect(result.totals.overdue_count).toBe(1)
  })

  it('converts EUR invoices to PLN using the supplied rate', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [
        mkInvoice({ currency: 'EUR', amount: 100, status: 'PAID', is_paid: true }),
        mkInvoice({ currency: 'PLN', amount: 100, status: 'PAID', is_paid: true }),
      ],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.totals.issued).toBe(530)
    expect(result.totals.paid).toBe(530)
  })

  it('ignores cancelled invoices in totals but counts them in distribution', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [
        mkInvoice({ status: 'CANCELLED', amount: 9999 }),
        mkInvoice({ status: 'PAID', is_paid: true, amount: 100 }),
      ],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.totals.issued).toBe(100)
    expect(result.statusDistribution.CANCELLED).toBe(1)
    expect(result.totals.count).toBe(1)
  })

  it('computes DSO (average days between invoice_date and paid_date)', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [
        mkInvoice({
          status: 'PAID',
          is_paid: true,
          invoice_date: '2025-04-01',
          paid_date: '2025-04-11', // 10 days
        }),
        mkInvoice({
          status: 'PAID',
          is_paid: true,
          invoice_date: '2025-05-01',
          paid_date: '2025-05-21', // 20 days
        }),
      ],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.dso).toBe(15)
  })

  it('returns zero DSO when no invoice has been paid', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [mkInvoice({ status: 'SENT', due_date: '2025-07-15' })],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.dso).toBe(0)
  })

  it('buckets invoices into monthly revenue points', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [
        mkInvoice({ invoice_date: '2025-04-01', amount: 100, status: 'PAID', is_paid: true }),
        mkInvoice({ invoice_date: '2025-05-01', amount: 200, status: 'PAID', is_paid: true }),
        mkInvoice({ invoice_date: '2025-05-15', amount: 50, status: 'SENT', due_date: '2025-07-30' }),
      ],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.monthlyRevenue).toHaveLength(2)
    expect(result.monthlyRevenue[0]).toMatchObject({ month: '2025-04', issued_pln: 100, paid_pln: 100 })
    expect(result.monthlyRevenue[1]).toMatchObject({ month: '2025-05', issued_pln: 250, paid_pln: 200 })
  })

  it('ranks top clients by revenue and caps at 5', () => {
    const invoices = [
      mkInvoice({ client_id: 'c1', amount: 1000, status: 'PAID', is_paid: true }),
      mkInvoice({ client_id: 'c2', amount: 500, status: 'PAID', is_paid: true }),
      mkInvoice({ client_id: 'c2', amount: 500, status: 'PAID', is_paid: true }),
    ]
    const result = calculateInvoiceAnalytics({ invoices, clientNames, eurRate: 4.3, now: NOW })
    expect(result.topClients).toHaveLength(2)
    expect(result.topClients[0]).toMatchObject({ client_name: 'ACME', revenue_pln: 1000 })
    expect(result.topClients[1]).toMatchObject({ client_name: 'Globex', revenue_pln: 1000, invoice_count: 2 })
  })

  it('labels invoices without a client_id as "Bez klienta"', () => {
    const result = calculateInvoiceAnalytics({
      invoices: [mkInvoice({ client_id: null, amount: 50, status: 'PAID', is_paid: true })],
      clientNames,
      eurRate: 4.3,
      now: NOW,
    })
    expect(result.topClients[0].client_name).toBe('Bez klienta')
    expect(result.topClients[0].client_id).toBeNull()
  })
})
