import { describe, it, expect } from 'vitest'
import { findGoalReachedDate } from '@/lib/finance/goal'
import type { Goal } from '@/features/dashboard/domain'
import type { WorkEntry } from '@/lib/types'

const plDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })

function entry(over: Partial<WorkEntry>): WorkEntry {
  return {
    id: 'e',
    user_id: 'u1',
    client_id: 'c1',
    project_id: null,
    date: '2025-06-01',
    status: 'worked',
    hours: 8,
    quantity: null,
    quantity_from: null,
    quantity_to: null,
    category: null,
    tags: [],
    notes: null,
    billing_rate: 100,
    billing_currency: 'PLN',
    billing_work_type: 'hourly',
    billing_unit: null,
    created_at: '2025-06-01T00:00:00Z',
    ...over,
  }
}

describe('findGoalReachedDate', () => {
  it('returns the day cumulative PLN earnings cross the target', () => {
    const goal: Goal = { amount: 1500, currency: 'PLN' }
    const entries = [
      entry({ id: 'a', date: '2025-06-01', hours: 8, billing_rate: 100 }), // 800
      entry({ id: 'b', date: '2025-06-02', hours: 8, billing_rate: 100 }), // 1600 -> crosses
      entry({ id: 'c', date: '2025-06-03', hours: 8, billing_rate: 100 }),
    ]
    expect(findGoalReachedDate(entries, [], goal, 4.3)).toBe(plDate('2025-06-02'))
  })

  it('ignores earnings in a different currency than the goal (currency isolation)', () => {
    const goal: Goal = { amount: 100, currency: 'EUR' }
    const entries = [
      entry({ id: 'a', date: '2025-06-01', hours: 10, billing_rate: 100, billing_currency: 'PLN' }), // PLN only
      entry({ id: 'b', date: '2025-06-05', hours: 2, billing_rate: 60, billing_currency: 'EUR' }), // 120 EUR
    ]
    // PLN entry must not count toward the EUR goal.
    expect(findGoalReachedDate(entries, [], goal, 4.3)).toBe(plDate('2025-06-05'))
  })

  it('uses piecework quantity * rate, not hours', () => {
    const goal: Goal = { amount: 50, currency: 'PLN' }
    const entries = [
      entry({
        id: 'a',
        date: '2025-06-04',
        hours: null,
        quantity: 25,
        billing_rate: 2,
        billing_work_type: 'piecework',
      }), // 50
    ]
    expect(findGoalReachedDate(entries, [], goal, 4.3)).toBe(plDate('2025-06-04'))
  })

  it('returns null when goal is unset or never reached', () => {
    const entries = [entry({ id: 'a', billing_rate: 1, hours: 1 })]
    expect(findGoalReachedDate(entries, [], null, 4.3)).toBeNull()
    expect(findGoalReachedDate(entries, [], { amount: 0, currency: 'PLN' }, 4.3)).toBeNull()
    expect(findGoalReachedDate(entries, [], { amount: 9999, currency: 'PLN' }, 4.3)).toBeNull()
  })
})
