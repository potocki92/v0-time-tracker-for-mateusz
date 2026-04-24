import { describe, it, expect } from 'vitest'
import { buildAccountingCsv } from '@/lib/export/accounting-csv'
import type { Client, Invoice } from '@/lib/types'

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
    is_paid: true,
    status: 'PAID',
    paid_date: '2025-06-10',
    file_url: null,
    notes: null,
    created_at: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

function mkClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    user_id: 'u1',
    name: 'ACME',
    nip: '1234567890',
    regon: null,
    address: null,
    city: null,
    postal_code: null,
    region: null,
    country_code: null,
    phone: null,
    email: null,
    website: null,
    locale: null,
    timezone: null,
    work_type: 'hourly',
    rate: 100,
    currency: 'PLN',
    unit: null,
    is_default: false,
    color: '#000000',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('buildAccountingCsv', () => {
  it('emits header + row in fakturownia format with BOM and CRLF', () => {
    const csv = buildAccountingCsv({
      invoices: [mkInvoice()],
      clients: [mkClient()],
      format: 'fakturownia',
    })
    expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0].split(';')[0]).toBe('Numer')
    expect(lines[1]).toContain('FV 1/06/2025')
    expect(lines[1]).toContain('1234567890')
    expect(lines[1]).toContain('PAID')
  })

  it('honours the separator override for iFirma', () => {
    const csv = buildAccountingCsv({
      invoices: [mkInvoice()],
      clients: [mkClient()],
      format: 'ifirma',
      separator: ',',
      withBom: false,
    })
    expect(csv.charCodeAt(0)).not.toBe(0xfeff)
    expect(csv.split('\r\n')[0]).toBe(
      'NumerFaktury,DataWystawienia,DataSprzedazy,NazwaKontrahenta,NIP,Netto,VAT,Brutto,Waluta',
    )
  })

  it('quotes values containing the separator or quotes', () => {
    const csv = buildAccountingCsv({
      invoices: [mkInvoice({ recipient: 'ACME; spółka "z o.o."' })],
      clients: [mkClient()],
      format: 'generic',
      separator: ';',
      withBom: false,
    })
    expect(csv).toContain('"ACME; spółka ""z o.o."""')
  })

  it('falls back to client.name when invoice.recipient is null', () => {
    const csv = buildAccountingCsv({
      invoices: [mkInvoice({ recipient: null })],
      clients: [mkClient({ name: 'FallbackClient' })],
      format: 'wfirma',
      withBom: false,
    })
    expect(csv).toContain('FallbackClient')
  })
})
