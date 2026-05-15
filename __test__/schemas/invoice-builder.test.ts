import { describe, expect, it } from 'vitest'

import { invoiceBuilderSchema } from '@/lib/schemas/invoice-builder.schema'
import type { Client, Invoice } from '@/lib/types'
import { invoiceToBuilderValues } from '@/features/invoices/components/builder/form/invoice-builder.adapters'
import { resolveBuyerCountryCode } from '@/features/invoices/components/builder/form/invoice-builder.helpers'

const baseBuilderValues = {
  invoice_number: 'FV/05/2026/01',
  issue_date: '2026-05-15',
  sale_date: '2026-05-15',
  due_date: '2026-05-29',
  currency: 'EUR' as const,
  exchange_rate: 4.3,
  exchange_rate_date: '2026-05-15',
  language: 'pl' as const,
  buyer: {
    name: 'Acme GmbH',
    tax_id: 'DE123456789',
    country_code: 'DE',
    address: '',
    city: '',
    postal_code: '',
    email: '',
    is_vat_eu: false,
  },
  items: [
    {
      id: 'line_1',
      description: 'Service',
      unit: 'h',
      quantity: 1,
      unit_price_net: 100,
      vat_mode: 'standard' as const,
      vat_rate: 23,
    },
  ],
  payment: {
    method: 'bank_transfer' as const,
    bank_account: '',
    bank_name: '',
    swift: '',
  },
  notes: '',
}

describe('invoiceBuilderSchema', () => {
  it('accepts a German tax number with slashes', () => {
    const result = invoiceBuilderSchema.safeParse({
      ...baseBuilderValues,
      buyer: {
        ...baseBuilderValues.buyer,
        tax_id: '22/287/20628',
      },
    })

    expect(result.success).toBe(true)
  })
})

describe('invoice builder buyer country resolution', () => {
  it('infers Germany from German VAT IDs and tax numbers', () => {
    expect(resolveBuyerCountryCode(null, 'DE123456789')).toBe('DE')
    expect(resolveBuyerCountryCode(null, '22/287/20628')).toBe('DE')
  })

  it('hydrates legacy German clients without country_code as DE in edit mode', () => {
    const invoice: Invoice = {
      id: 'invoice-1',
      user_id: 'user-1',
      client_id: 'client-1',
      name: 'FV/05/2026/01 - Acme GmbH',
      issue_date: '2026-05-15',
      invoice_date: '2026-05-15',
      due_date: '2026-05-29',
      invoice_number: 'FV/05/2026/01',
      recipient: 'Acme GmbH',
      description: null,
      billing_period: 'Q2 2026',
      amount: 123,
      net_amount: 100,
      vat_amount: 23,
      gross_amount: 123,
      currency: 'EUR',
      is_paid: false,
      file_url: null,
      notes: null,
      created_at: '2026-05-15T00:00:00.000Z',
    }
    const client: Client = {
      id: 'client-1',
      user_id: 'user-1',
      name: 'Acme GmbH',
      nip: '22/287/20628',
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
      currency: 'EUR',
      unit: null,
      is_default: false,
      color: '#3b82f6',
      created_at: '2026-05-15T00:00:00.000Z',
    }

    const values = invoiceToBuilderValues(invoice, { client })

    expect(values.buyer.country_code).toBe('DE')
    expect(invoiceBuilderSchema.safeParse(values).success).toBe(true)
  })
})
