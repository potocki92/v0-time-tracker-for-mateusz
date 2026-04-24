import { describe, it, expect } from 'vitest'
import { buildJpkFaXml, defaultPeriodFromInvoices, type JpkFaInvoice, type IssuerData } from '@/lib/export/jpk-fa'
import type { Invoice, InvoiceLineItem } from '@/lib/types'

function mkInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'i1',
    user_id: 'u1',
    client_id: 'c1',
    name: 'FV',
    issue_date: '2025-06-01',
    invoice_date: '2025-06-01',
    due_date: '2025-06-15',
    invoice_number: 'FV 1/06/2025',
    recipient: 'ACME',
    description: null,
    billing_period: null,
    amount: 1230,
    net_amount: 1000,
    vat_amount: 230,
    gross_amount: 1230,
    currency: 'PLN',
    is_paid: false,
    status: 'SENT',
    file_url: null,
    notes: null,
    created_at: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

function mkItem(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    id: 'li1',
    invoice_id: 'i1',
    user_id: 'u1',
    position: 1,
    description: 'Usługa programistyczna',
    unit: 'godz.',
    quantity: 10,
    unit_price_net: 100,
    vat_rate: 23,
    net_amount: 1000,
    vat_amount: 230,
    gross_amount: 1230,
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

const ISSUER: IssuerData = {
  nip: '9999999999',
  name: 'Freelancer Testowy',
  email: 'freelancer@example.com',
  address: {
    country_code: 'PL',
    building_nr: '10',
    city: 'Warszawa',
    postal_code: '00-001',
  },
  office_code: '1405',
}

describe('buildJpkFaXml', () => {
  it('produces a well-formed, escaped XML document with header and totals', () => {
    const invoice = mkInvoice({ invoice_number: 'FV <2>/06/2025', recipient: 'A&B sp. z o.o.' })
    const entry: JpkFaInvoice = {
      invoice,
      buyer: { name: invoice.recipient, nip: '1112223344', country_code: 'PL' },
      lineItems: [mkItem()],
    }

    const xml = buildJpkFaXml(
      {
        issuer: ISSUER,
        periodFrom: '2025-06-01',
        periodTo: '2025-06-30',
        createdAt: new Date('2025-06-15T12:00:00Z'),
      },
      [entry],
    )

    expect(xml.startsWith('<?xml version="1.0"')).toBe(true)
    expect(xml).toContain('<KodFormularza kodSystemowy="JPK_FA (3)"')
    expect(xml).toContain('<DataOd>2025-06-01</DataOd>')
    expect(xml).toContain('<DataDo>2025-06-30</DataDo>')
    expect(xml).toContain('<NIP>9999999999</NIP>')
    // Escaping of special characters in both the invoice number and buyer name.
    expect(xml).toContain('FV &lt;2&gt;/06/2025')
    expect(xml).toContain('A&amp;B sp. z o.o.')
    expect(xml).toContain('<LiczbaFaktur>1</LiczbaFaktur>')
    expect(xml).toContain('<LiczbaWierszyFaktur>1</LiczbaWierszyFaktur>')
    // Totals: gross 1230 = net 1000 + vat 230
    expect(xml).toContain('<WartoscFaktur>1230.00</WartoscFaktur>')
    expect(xml).toContain('<WartoscWierszyFaktur>1000.00</WartoscWierszyFaktur>')
  })

  it('handles an empty invoice list without crashing', () => {
    const xml = buildJpkFaXml(
      { issuer: ISSUER, periodFrom: '2025-01-01', periodTo: '2025-12-31' },
      [],
    )
    expect(xml).toContain('<LiczbaFaktur>0</LiczbaFaktur>')
    expect(xml).toContain('<LiczbaWierszyFaktur>0</LiczbaWierszyFaktur>')
  })
})

describe('defaultPeriodFromInvoices', () => {
  it('returns the min and max invoice_date found', () => {
    const result = defaultPeriodFromInvoices([
      mkInvoice({ invoice_date: '2025-05-15' }),
      mkInvoice({ invoice_date: '2025-02-01' }),
      mkInvoice({ invoice_date: '2025-07-31' }),
    ])
    expect(result.periodFrom).toBe('2025-02-01')
    expect(result.periodTo).toBe('2025-07-31')
  })

  it('falls back to today for an empty list', () => {
    const result = defaultPeriodFromInvoices([])
    expect(result.periodFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.periodTo).toBe(result.periodFrom)
  })
})
