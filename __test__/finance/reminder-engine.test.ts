import { describe, it, expect } from 'vitest'
import {
  classifyReminderKind,
  renderReminder,
  type ReminderCandidate,
} from '@/lib/finance/reminder-engine'

const TODAY = new Date('2025-06-15T10:00:00Z')

describe('classifyReminderKind', () => {
  it('UPCOMING_3D when due_date is exactly 3 days ahead', () => {
    expect(classifyReminderKind('2025-06-18', TODAY)).toBe('UPCOMING_3D')
  })

  it('DUE_TODAY when due_date equals today', () => {
    expect(classifyReminderKind('2025-06-15', TODAY)).toBe('DUE_TODAY')
  })

  it('OVERDUE_3D / 7D / 14D for the corresponding lag', () => {
    expect(classifyReminderKind('2025-06-12', TODAY)).toBe('OVERDUE_3D')
    expect(classifyReminderKind('2025-06-08', TODAY)).toBe('OVERDUE_7D')
    expect(classifyReminderKind('2025-06-01', TODAY)).toBe('OVERDUE_14D')
  })

  it('returns null for neutral days (e.g. 2 days ahead or 5 days overdue)', () => {
    expect(classifyReminderKind('2025-06-17', TODAY)).toBeNull()
    expect(classifyReminderKind('2025-06-10', TODAY)).toBeNull()
  })

  it('returns null for invalid date strings', () => {
    expect(classifyReminderKind('not-a-date', TODAY)).toBeNull()
  })
})

describe('renderReminder', () => {
  const candidate: ReminderCandidate = {
    invoice_id: 'i1',
    invoice_number: 'FV 1/06/2025',
    invoice_name: 'FV za maj',
    due_date: '2025-06-12',
    amount: 1234.56,
    currency: 'PLN',
    client_email: 'client@example.com',
    client_name: 'ACME sp. z o.o.',
    user_id: 'u1',
  }

  it('renders subject with invoice number', () => {
    const r = renderReminder(candidate, 'OVERDUE_3D')
    expect(r.subject).toContain('FV 1/06/2025')
    expect(r.subject).toContain('po terminie')
  })

  it('renders text containing amount and client name', () => {
    const r = renderReminder(candidate, 'OVERDUE_7D')
    expect(r.text).toContain('ACME sp. z o.o.')
    expect(r.text).toMatch(/1.?234,56/)
  })

  it('renders html with the same key facts', () => {
    const r = renderReminder(candidate, 'DUE_TODAY')
    expect(r.html).toContain('FV 1/06/2025')
    expect(r.html).toContain('Termin płatności przypada na dzisiaj')
  })

  it('falls back to invoice_name when invoice_number is null', () => {
    const r = renderReminder({ ...candidate, invoice_number: null }, 'UPCOMING_3D')
    expect(r.subject).toContain('FV za maj')
  })
})
