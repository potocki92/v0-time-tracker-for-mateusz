import { describe, it, expect } from 'vitest'
import {
  calculateEntryMoney,
  fallbackFromClient,
  sumEntriesByCurrency,
} from '@/lib/finance/entry-calculations'
import { toMajor } from '@/lib/finance/money'
import type { Client, WorkEntry } from '@/lib/types'

const baseEntry: WorkEntry = {
  id: 'e1',
  user_id: 'u1',
  client_id: 'c1',
  project_id: null,
  date: '2025-01-01',
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
  created_at: '2025-01-01T00:00:00Z',
}

const fallback = {
  rate: 50,
  currency: 'PLN' as const,
  workType: 'hourly' as const,
}

describe('calculateEntryMoney — hourly billing', () => {
  it('multiplies hours by entry rate', () => {
    const m = calculateEntryMoney(baseEntry, fallback)
    expect(m.currency).toBe('PLN')
    expect(toMajor(m)).toBe(800)
  })

  it('falls back to client rate when entry has no snapshot', () => {
    const m = calculateEntryMoney(
      { ...baseEntry, billing_rate: null, billing_currency: null, billing_work_type: null },
      fallback,
    )
    expect(toMajor(m)).toBe(400) // 8h * 50 PLN
  })

  it('handles fractional hours precisely', () => {
    const m = calculateEntryMoney(
      { ...baseEntry, hours: 7.25, billing_rate: 123.45 },
      fallback,
    )
    // 7.25 * 123.45 = 895.0125 -> 895.01
    expect(toMajor(m)).toBe(895.01)
  })
})

describe('calculateEntryMoney — edge cases', () => {
  it('returns zero when status is not worked', () => {
    const m = calculateEntryMoney({ ...baseEntry, status: 'vacation' }, fallback)
    expect(toMajor(m)).toBe(0)
  })

  it('returns zero when both entry and fallback rate are null/zero', () => {
    const m = calculateEntryMoney(
      { ...baseEntry, billing_rate: null },
      { ...fallback, rate: 0 },
    )
    expect(toMajor(m)).toBe(0)
  })

  it('never returns NaN when rate is null', () => {
    const m = calculateEntryMoney(
      { ...baseEntry, billing_rate: null, hours: 8 },
      { rate: Number.NaN as unknown as number, currency: 'PLN', workType: 'hourly' },
    )
    expect(Number.isFinite(toMajor(m))).toBe(true)
    expect(toMajor(m)).toBe(0)
  })

  it('treats negative hours as zero', () => {
    const m = calculateEntryMoney({ ...baseEntry, hours: -5 }, fallback)
    expect(toMajor(m)).toBe(0)
  })
})

describe('calculateEntryMoney — piecework billing', () => {
  const pieceworkEntry: WorkEntry = {
    ...baseEntry,
    billing_work_type: 'piecework',
    hours: null,
    quantity: 12,
    billing_rate: 5.5,
  }

  it('multiplies quantity by rate', () => {
    const m = calculateEntryMoney(pieceworkEntry, fallback)
    expect(toMajor(m)).toBe(66) // 12 * 5.5
  })

  it('derives quantity from quantity_from/to when quantity is null', () => {
    const m = calculateEntryMoney(
      { ...pieceworkEntry, quantity: null, quantity_from: 100, quantity_to: 115 },
      fallback,
    )
    expect(toMajor(m)).toBe(82.5) // 15 * 5.5
  })

  it('returns zero when quantity is zero or negative', () => {
    const m = calculateEntryMoney({ ...pieceworkEntry, quantity: 0 }, fallback)
    expect(toMajor(m)).toBe(0)
  })
})

describe('sumEntriesByCurrency', () => {
  it('buckets per currency', () => {
    const entries: WorkEntry[] = [
      { ...baseEntry, hours: 8, billing_rate: 100, billing_currency: 'PLN' },
      { ...baseEntry, id: 'e2', hours: 4, billing_rate: 25, billing_currency: 'EUR' },
      { ...baseEntry, id: 'e3', hours: 2, billing_rate: 100, billing_currency: 'PLN' },
    ]
    const result = sumEntriesByCurrency(entries, fallback)
    expect(toMajor(result.PLN)).toBe(1000) // 800 + 200
    expect(toMajor(result.EUR)).toBe(100) // 4 * 25
  })

  it('handles mixed status entries', () => {
    const entries: WorkEntry[] = [
      { ...baseEntry, status: 'worked', hours: 8, billing_rate: 100 },
      { ...baseEntry, id: 'e2', status: 'vacation', hours: 8, billing_rate: 100 },
      { ...baseEntry, id: 'e3', status: 'sick_leave', hours: 8, billing_rate: 100 },
    ]
    const result = sumEntriesByCurrency(entries, fallback)
    expect(toMajor(result.PLN)).toBe(800) // only the worked one
  })
})

describe('fallbackFromClient', () => {
  it('extracts rate, currency and work type', () => {
    const client: Pick<Client, 'rate' | 'currency' | 'work_type'> = {
      rate: 150,
      currency: 'EUR',
      work_type: 'piecework',
    }
    expect(fallbackFromClient(client)).toEqual({
      rate: 150,
      currency: 'EUR',
      workType: 'piecework',
    })
  })

  it('defaults to hourly when work_type is not piecework', () => {
    const client = { rate: 100, currency: 'PLN' as const, work_type: 'hourly' as const }
    expect(fallbackFromClient(client).workType).toBe('hourly')
  })
})
