import { describe, it, expect } from 'vitest'
import {
  InvoiceStatus,
  deriveInvoiceStatus,
  isTerminalStatus,
  isUnpaidStatus,
} from '@/lib/finance/invoice-status'

const NOW = new Date('2025-06-15T12:00:00Z')

describe('deriveInvoiceStatus — trusts persisted status when valid', () => {
  it('returns DRAFT from column', () => {
    expect(deriveInvoiceStatus({ status: 'DRAFT' }, NOW)).toBe(InvoiceStatus.DRAFT)
  })

  it('returns PAID from column even when due_date is in the past', () => {
    expect(deriveInvoiceStatus({ status: 'PAID', due_date: '2020-01-01' }, NOW)).toBe(InvoiceStatus.PAID)
  })

  it('promotes SENT to OVERDUE when due_date is past and cron has not run', () => {
    expect(
      deriveInvoiceStatus({ status: 'SENT', due_date: '2025-06-14' }, NOW),
    ).toBe(InvoiceStatus.OVERDUE)
  })

  it('keeps SENT when due_date is today or future', () => {
    expect(deriveInvoiceStatus({ status: 'SENT', due_date: '2025-06-15' }, NOW)).toBe(
      InvoiceStatus.SENT,
    )
    expect(deriveInvoiceStatus({ status: 'SENT', due_date: '2025-06-16' }, NOW)).toBe(
      InvoiceStatus.SENT,
    )
  })

  it('keeps CANCELLED intact', () => {
    expect(deriveInvoiceStatus({ status: 'CANCELLED' }, NOW)).toBe(InvoiceStatus.CANCELLED)
  })
})

describe('deriveInvoiceStatus — legacy rows (no status column)', () => {
  it('PAID when is_paid=true', () => {
    expect(deriveInvoiceStatus({ is_paid: true }, NOW)).toBe(InvoiceStatus.PAID)
  })

  it('OVERDUE when due_date is past and is_paid=false', () => {
    expect(deriveInvoiceStatus({ is_paid: false, due_date: '2025-06-14' }, NOW)).toBe(
      InvoiceStatus.OVERDUE,
    )
  })

  it('DRAFT when there is no invoice_number', () => {
    expect(deriveInvoiceStatus({ is_paid: false, invoice_number: null }, NOW)).toBe(
      InvoiceStatus.DRAFT,
    )
  })

  it('SENT when invoice_number exists, is_paid=false, not overdue', () => {
    expect(
      deriveInvoiceStatus(
        { is_paid: false, invoice_number: 'FV 1/06/2025', due_date: '2025-06-20' },
        NOW,
      ),
    ).toBe(InvoiceStatus.SENT)
  })

  it('falls back to DRAFT when almost nothing is known', () => {
    expect(deriveInvoiceStatus({}, NOW)).toBe(InvoiceStatus.DRAFT)
  })
})

describe('deriveInvoiceStatus — invalid persisted status', () => {
  it('ignores unknown status and falls back to legacy derivation', () => {
    expect(
      deriveInvoiceStatus(
        { status: 'WEIRD', is_paid: true } as Parameters<typeof deriveInvoiceStatus>[0],
        NOW,
      ),
    ).toBe(InvoiceStatus.PAID)
  })
})

describe('status predicates', () => {
  it('isUnpaidStatus', () => {
    expect(isUnpaidStatus(InvoiceStatus.DRAFT)).toBe(true)
    expect(isUnpaidStatus(InvoiceStatus.SENT)).toBe(true)
    expect(isUnpaidStatus(InvoiceStatus.OVERDUE)).toBe(true)
    expect(isUnpaidStatus(InvoiceStatus.PAID)).toBe(false)
    expect(isUnpaidStatus(InvoiceStatus.CANCELLED)).toBe(false)
  })

  it('isTerminalStatus', () => {
    expect(isTerminalStatus(InvoiceStatus.PAID)).toBe(true)
    expect(isTerminalStatus(InvoiceStatus.CANCELLED)).toBe(true)
    expect(isTerminalStatus(InvoiceStatus.SENT)).toBe(false)
  })
})
