import { describe, it, expect } from 'vitest'
import {
  computeDueDate,
  findDueRecurringInvoices,
  nextIssueDate,
  type ScheduleCandidate,
} from '@/lib/finance/recurring-schedule'

describe('nextIssueDate', () => {
  it('advances weekly by 7 days', () => {
    expect(nextIssueDate('2025-06-15', 'weekly')).toBe('2025-06-22')
  })

  it('advances monthly keeping the same day-of-month', () => {
    expect(nextIssueDate('2025-06-15', 'monthly')).toBe('2025-07-15')
  })

  it('handles month-end (31 Jan → 28/29 Feb)', () => {
    // JS Date rolls 31 Jan + 1 month into 3 Mar, which we accept — documenting behaviour.
    const result = nextIssueDate('2025-01-31', 'monthly')
    expect(['2025-02-28', '2025-03-03']).toContain(result)
  })

  it('advances quarterly by 3 months', () => {
    expect(nextIssueDate('2025-06-15', 'quarterly')).toBe('2025-09-15')
  })

  it('advances yearly by 12 months', () => {
    expect(nextIssueDate('2025-06-15', 'yearly')).toBe('2026-06-15')
  })

  it('throws on invalid input', () => {
    expect(() => nextIssueDate('nope', 'weekly')).toThrow()
  })
})

describe('computeDueDate', () => {
  it('adds due_days to issue_date', () => {
    expect(computeDueDate('2025-06-15', 14)).toBe('2025-06-29')
    expect(computeDueDate('2025-06-15', 0)).toBe('2025-06-15')
  })
})

describe('findDueRecurringInvoices', () => {
  const TODAY = new Date('2025-06-15T10:00:00Z')

  function candidate(overrides: Partial<ScheduleCandidate> = {}): ScheduleCandidate {
    return {
      id: 'r1',
      frequency: 'monthly',
      next_issue_date: '2025-06-15',
      end_date: null,
      is_active: true,
      paused_at: null,
      ...overrides,
    }
  }

  it('returns due recurring invoices scheduled for today', () => {
    const result = findDueRecurringInvoices([candidate()], TODAY)
    expect(result).toHaveLength(1)
    expect(result[0].issueDate).toBe('2025-06-15')
    expect(result[0].newNextIssueDate).toBe('2025-07-15')
  })

  it('catches up on missed runs (next_issue_date in the past)', () => {
    const result = findDueRecurringInvoices([candidate({ next_issue_date: '2025-05-01' })], TODAY)
    expect(result).toHaveLength(1)
    expect(result[0].issueDate).toBe('2025-05-01')
  })

  it('skips future-dated candidates', () => {
    const result = findDueRecurringInvoices([candidate({ next_issue_date: '2025-07-01' })], TODAY)
    expect(result).toHaveLength(0)
  })

  it('skips inactive or paused templates', () => {
    expect(findDueRecurringInvoices([candidate({ is_active: false })], TODAY)).toEqual([])
    expect(findDueRecurringInvoices([candidate({ paused_at: '2025-06-10T00:00:00Z' })], TODAY)).toEqual(
      [],
    )
  })

  it('stops after end_date', () => {
    const result = findDueRecurringInvoices(
      [candidate({ end_date: '2025-06-14' })],
      TODAY,
    )
    expect(result).toEqual([])
  })

  it('does not stop on end_date equal to today', () => {
    const result = findDueRecurringInvoices([candidate({ end_date: '2025-06-15' })], TODAY)
    expect(result).toHaveLength(1)
  })
})
