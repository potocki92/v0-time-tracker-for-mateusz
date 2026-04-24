import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INVOICE_PREFIX,
  INVOICE_NUMBER_PLACEHOLDER,
  displayInvoiceNumber,
  formatInvoiceNumber,
  parseInvoiceNumber,
  sanitizeInvoicePrefix,
} from '@/lib/finance/invoice-number'

describe('sanitizeInvoicePrefix', () => {
  it('falls back to default when empty', () => {
    expect(sanitizeInvoicePrefix('')).toBe(DEFAULT_INVOICE_PREFIX)
    expect(sanitizeInvoicePrefix(null)).toBe(DEFAULT_INVOICE_PREFIX)
    expect(sanitizeInvoicePrefix(undefined)).toBe(DEFAULT_INVOICE_PREFIX)
    expect(sanitizeInvoicePrefix('   ')).toBe(DEFAULT_INVOICE_PREFIX)
  })

  it('uppercases and trims', () => {
    expect(sanitizeInvoicePrefix(' fr ')).toBe('FR')
  })
})

describe('formatInvoiceNumber', () => {
  it('formats to "PREFIX seq/MM/YYYY"', () => {
    const date = new Date(Date.UTC(2026, 3, 11)) // April
    expect(formatInvoiceNumber('FR', 3, date)).toBe('FR 3/04/2026')
  })

  it('zero-pads the month', () => {
    const date = new Date(Date.UTC(2026, 0, 5)) // January
    expect(formatInvoiceNumber('FV', 12, date)).toBe('FV 12/01/2026')
  })

  it('does not pad the sequence (business requirement)', () => {
    const date = new Date(Date.UTC(2026, 11, 31)) // December
    expect(formatInvoiceNumber('FV', 1, date)).toBe('FV 1/12/2026')
    expect(formatInvoiceNumber('FV', 100, date)).toBe('FV 100/12/2026')
  })

  it('applies prefix sanitization', () => {
    const date = new Date(Date.UTC(2026, 3, 1))
    expect(formatInvoiceNumber(' fr ', 7, date)).toBe('FR 7/04/2026')
    expect(formatInvoiceNumber('', 7, date)).toBe(`${DEFAULT_INVOICE_PREFIX} 7/04/2026`)
  })
})

describe('displayInvoiceNumber', () => {
  it('returns the business number when present', () => {
    expect(displayInvoiceNumber({ invoice_number: 'FR 3/04/2026' })).toBe('FR 3/04/2026')
    expect(displayInvoiceNumber('FR 3/04/2026')).toBe('FR 3/04/2026')
  })

  it('returns a neutral placeholder when missing — never the raw id', () => {
    expect(displayInvoiceNumber({ invoice_number: null })).toBe(INVOICE_NUMBER_PLACEHOLDER)
    expect(displayInvoiceNumber({ invoice_number: '' })).toBe(INVOICE_NUMBER_PLACEHOLDER)
    expect(displayInvoiceNumber({ invoice_number: '   ' })).toBe(INVOICE_NUMBER_PLACEHOLDER)
    expect(displayInvoiceNumber(null)).toBe(INVOICE_NUMBER_PLACEHOLDER)
    expect(displayInvoiceNumber(undefined)).toBe(INVOICE_NUMBER_PLACEHOLDER)
  })

  it('does not accidentally return an id-like value', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef0123456789'
    // Caller passes a bare object without invoice_number — we must not leak other fields.
    expect(displayInvoiceNumber({ invoice_number: undefined })).toBe(INVOICE_NUMBER_PLACEHOLDER)
    // If caller accidentally passes the id as invoice_number, we render it as-is
    // (the UI invariant is enforced at the call site by passing the invoice object).
    expect(displayInvoiceNumber({ invoice_number: uuid })).toBe(uuid)
  })
})

describe('parseInvoiceNumber', () => {
  it('parses a well-formed number back into parts', () => {
    expect(parseInvoiceNumber('FR 3/04/2026')).toEqual({
      prefix: 'FR',
      sequence: 3,
      month: 4,
      year: 2026,
    })
  })

  it('returns null for unknown shapes', () => {
    expect(parseInvoiceNumber(null)).toBeNull()
    expect(parseInvoiceNumber('')).toBeNull()
    expect(parseInvoiceNumber('FR-3-04-2026')).toBeNull()
    expect(parseInvoiceNumber('3/04/2026')).toBeNull()
  })

  it('round-trips with formatInvoiceNumber', () => {
    const date = new Date(Date.UTC(2026, 6, 1))
    const formatted = formatInvoiceNumber('FV', 42, date)
    const parsed = parseInvoiceNumber(formatted)
    expect(parsed).toEqual({ prefix: 'FV', sequence: 42, month: 7, year: 2026 })
  })
})
