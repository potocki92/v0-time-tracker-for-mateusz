import { describe, it, expect } from 'vitest'
import { isRealizedEntry, partitionByRealization } from '@/lib/finance/realization'
import type { WorkEntry } from '@/lib/types'

const TODAY = '2025-06-15'

function entry(over: Partial<WorkEntry>): WorkEntry {
  return {
    id: 'e',
    user_id: 'u1',
    client_id: 'c1',
    project_id: null,
    date: '2025-06-10',
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
    created_at: '2025-06-10T00:00:00Z',
    ...over,
  }
}

describe('isRealizedEntry', () => {
  it('treats a past real entry as realized', () => {
    expect(isRealizedEntry(entry({ date: '2025-06-10', entry_kind: 'real' }), TODAY)).toBe(true)
  })

  it('treats today as realized', () => {
    expect(isRealizedEntry(entry({ date: TODAY, entry_kind: 'real' }), TODAY)).toBe(true)
  })

  it('treats a future real entry as plan', () => {
    expect(isRealizedEntry(entry({ date: '2025-06-20', entry_kind: 'real' }), TODAY)).toBe(false)
  })

  it('treats a predicted entry as plan even in the past', () => {
    expect(isRealizedEntry(entry({ date: '2025-06-10', entry_kind: 'predicted' }), TODAY)).toBe(false)
  })

  it('defaults missing entry_kind to real', () => {
    expect(isRealizedEntry(entry({ date: '2025-06-10', entry_kind: undefined }), TODAY)).toBe(true)
  })
})

describe('partitionByRealization', () => {
  it('splits realized from predicted/future', () => {
    const entries = [
      entry({ id: 'a', date: '2025-06-10', entry_kind: 'real' }),
      entry({ id: 'b', date: '2025-06-20', entry_kind: 'real' }),
      entry({ id: 'c', date: '2025-06-12', entry_kind: 'predicted' }),
      entry({ id: 'd', date: TODAY, entry_kind: 'real' }),
    ]
    const { realized, predicted } = partitionByRealization(entries, TODAY)
    expect(realized.map((e) => e.id)).toEqual(['a', 'd'])
    expect(predicted.map((e) => e.id)).toEqual(['b', 'c'])
  })
})
