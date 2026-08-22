import { describe, it, expect } from 'vitest'
import { computeActiveStreak } from '@/lib/date/streak'
import { selectActiveStreak } from '@/features/calendar/domain/calendar.selectors'
import type { WorkEntry } from '@/lib/types'

function entry(date: string, status: WorkEntry['status'] = 'worked'): WorkEntry {
  return {
    id: `e-${date}`,
    user_id: 'u1',
    client_id: null,
    project_id: null,
    date,
    status,
    entry_kind: 'real',
    hours: 8,
    quantity: null,
    quantity_from: null,
    quantity_to: null,
    category: null,
    tags: [],
    notes: null,
    billing_rate: null,
    billing_currency: null,
    billing_work_type: null,
    billing_unit: null,
    created_at: date,
  }
}

/** Sroda, 12 sierpnia 2026. */
const TODAY = new Date(2026, 7, 12)

describe('computeActiveStreak', () => {
  it('liczy dni robocze z rzedu do dzis', () => {
    const entries = ['2026-08-10', '2026-08-11', '2026-08-12'].map((d) => entry(d))
    expect(computeActiveStreak(entries, TODAY).current).toBe(3)
  })

  it('przeskakuje weekend zamiast przerywac serie', () => {
    const entries = ['2026-08-07', '2026-08-10', '2026-08-11', '2026-08-12'].map((d) => entry(d))
    expect(computeActiveStreak(entries, TODAY).current).toBe(4)
  })

  it('dzien wolny nie przerywa serii', () => {
    const entries = [
      entry('2026-08-10'),
      entry('2026-08-11', 'vacation'),
      entry('2026-08-12'),
    ]
    expect(computeActiveStreak(entries, TODAY).current).toBe(2)
  })

  it('luka w dniu roboczym konczy serie', () => {
    const entries = [entry('2026-08-10'), entry('2026-08-12')]
    expect(computeActiveStreak(entries, TODAY).current).toBe(1)
  })

  it('Kalendarz i Pulpit licza te sama serie', () => {
    // selectActiveStreak zostal delegowany do lib/date/streak — obie sekcje
    // musza widziec dokladnie te sama liczbe.
    const entries = ['2026-08-10', '2026-08-11', '2026-08-12'].map((d) => entry(d))
    expect(selectActiveStreak(entries, TODAY)).toEqual(computeActiveStreak(entries, TODAY))
  })
})
