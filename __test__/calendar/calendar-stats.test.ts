import { describe, it, expect } from 'vitest'
import { selectCalendarStats } from '@/app/(app)/calendar/_domain/calendar.selectors'
import type { Client, WorkEntry } from '@/lib/types'

const TODAY = '2026-05-15'

let seq = 0
const entry = (over: Partial<WorkEntry> = {}): WorkEntry => ({
  id: `e${seq++}`,
  user_id: 'u1',
  client_id: 'c-pln',
  project_id: null,
  date: '2026-05-10',
  status: 'worked',
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
  created_at: '',
  ...over,
})

const plnClient: Client = {
  id: 'c-pln',
  user_id: 'u1',
  name: 'PLN Co',
  nip: null,
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
  currency: 'PLN',
  unit: null,
  is_default: true,
  color: '#000',
  created_at: '',
}

const eurClient: Client = { ...plnClient, id: 'c-eur', name: 'EUR Co', rate: 10, currency: 'EUR' }

const clients = [plnClient, eurClient]

describe('selectCalendarStats', () => {
  it('splits realized (real, past) from planned (predicted/future)', () => {
    const stats = selectCalendarStats(
      [
        entry({ date: '2026-05-10', entry_kind: 'real', hours: 8 }), // realized: 800
        entry({ date: '2026-05-20', entry_kind: 'predicted', hours: 8 }), // planned: 800
      ],
      clients,
      4,
      TODAY,
    )

    expect(stats.realizedEarningsPLN).toBe(800)
    expect(stats.predictedEarningsPLN).toBe(800)
    expect(stats.totalEarningsPLN).toBe(1600)
    expect(stats.realizedSharePercent).toBe(50)
    expect(stats.realizedDays).toBe(1)
    expect(stats.predictedDays).toBe(1)
    expect(stats.workDays).toBe(2)
    expect(stats.totalHours).toBe(16)
    expect(stats.realizedHours).toBe(8)
    expect(stats.predictedHours).toBe(8)
  })

  it('deduplicates a day with both real and predicted entries (real wins)', () => {
    const stats = selectCalendarStats(
      [
        entry({ date: '2026-05-10', entry_kind: 'predicted', hours: 8 }),
        entry({ date: '2026-05-10', entry_kind: 'real', hours: 8 }),
      ],
      clients,
      4,
      TODAY,
    )

    expect(stats.workDays).toBe(1)
    expect(stats.totalHours).toBe(8)
    expect(stats.realizedEarningsPLN).toBe(800)
    expect(stats.predictedEarningsPLN).toBe(0)
    expect(stats.realizedSharePercent).toBe(100)
  })

  it('treats a stale predicted entry in the past as plan, not realized', () => {
    const stats = selectCalendarStats(
      [entry({ date: '2026-05-10', entry_kind: 'predicted', hours: 8 })],
      clients,
      4,
      TODAY,
    )

    expect(stats.realizedEarningsPLN).toBe(0)
    expect(stats.predictedEarningsPLN).toBe(800)
    expect(stats.predictedDays).toBe(1)
  })

  it('counts an entry dated today as realized', () => {
    const stats = selectCalendarStats(
      [entry({ date: TODAY, entry_kind: 'real', hours: 8 })],
      clients,
      4,
      TODAY,
    )

    expect(stats.realizedEarningsPLN).toBe(800)
    expect(stats.predictedEarningsPLN).toBe(0)
  })

  it('converts EUR earnings to PLN using the provided rate', () => {
    const stats = selectCalendarStats(
      [entry({ date: '2026-05-10', client_id: 'c-eur', hours: 8 })], // 10 EUR * 8 = 80 EUR
      clients,
      4,
      TODAY,
    )

    expect(stats.realizedEarningsPLN).toBe(320) // 80 EUR * 4
  })

  it('ignores non-worked days for earnings but counts them as free days', () => {
    const stats = selectCalendarStats(
      [
        entry({ date: '2026-05-10', status: 'worked', hours: 8 }),
        entry({ date: '2026-05-11', status: 'vacation', hours: null }),
        entry({ date: '2026-05-12', status: 'sick_leave', hours: null }),
        entry({ date: '2026-05-13', status: 'day_off', hours: null }),
      ],
      clients,
      4,
      TODAY,
    )

    expect(stats.workDays).toBe(1)
    expect(stats.freeDays).toBe(3)
    expect(stats.absences).toBe(2)
    expect(stats.realizedEarningsPLN).toBe(800)
  })

  it('returns safe zeros for an empty month (no NaN)', () => {
    const stats = selectCalendarStats([], clients, 4, TODAY)

    expect(stats.totalEarningsPLN).toBe(0)
    expect(stats.realizedSharePercent).toBe(0)
    expect(stats.progressPercent).toBe(0)
    expect(stats.workDays).toBe(0)
    expect(Number.isNaN(stats.realizedSharePercent)).toBe(false)
  })

  it('computes hour-baseline progress and isAhead flag', () => {
    const under = selectCalendarStats(
      [entry({ date: '2026-05-10', hours: 80 })],
      clients,
      4,
      TODAY,
    )
    expect(under.progressPercent).toBe(50)
    expect(under.isAhead).toBe(false)

    const over = selectCalendarStats(
      [entry({ date: '2026-05-10', hours: 200 })],
      clients,
      4,
      TODAY,
    )
    expect(over.progressPercent).toBe(100)
    expect(over.isAhead).toBe(true)
  })
})
