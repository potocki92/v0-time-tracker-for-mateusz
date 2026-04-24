import { describe, it, expect } from 'vitest'
import { invoiceSchema } from '@/lib/schemas/invoice.schema'

describe('invoiceSchema', () => {
  const baseInput = {
    name: 'FV dla ACME',
    invoice_date: '2025-06-01',
    amount: 123.45,
    currency: 'PLN' as const,
    is_paid: false,
  }

  it('accepts a minimal valid invoice', () => {
    const result = invoiceSchema.safeParse(baseInput)
    expect(result.success).toBe(true)
  })

  it('rejects due_date earlier than invoice_date', () => {
    const result = invoiceSchema.safeParse({
      ...baseInput,
      invoice_date: '2025-06-15',
      due_date: '2025-06-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('due_date')
    }
  })

  it('accepts due_date equal to invoice_date', () => {
    const result = invoiceSchema.safeParse({
      ...baseInput,
      due_date: baseInput.invoice_date,
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-positive amount', () => {
    expect(invoiceSchema.safeParse({ ...baseInput, amount: 0 }).success).toBe(false)
    expect(invoiceSchema.safeParse({ ...baseInput, amount: -5 }).success).toBe(false)
  })

  it('coerces string amount into number', () => {
    const result = invoiceSchema.safeParse({ ...baseInput, amount: '99.99' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(99.99)
  })

  it('rejects unknown status', () => {
    const result = invoiceSchema.safeParse({
      ...baseInput,
      status: 'ARCHIVED',
    })
    expect(result.success).toBe(false)
  })

  it('accepts known status', () => {
    const result = invoiceSchema.safeParse({ ...baseInput, status: 'SENT' })
    expect(result.success).toBe(true)
  })
})
