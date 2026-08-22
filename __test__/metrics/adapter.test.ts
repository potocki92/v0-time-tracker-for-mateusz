import { describe, expect, it } from 'vitest'
import {
  UNASSIGNED_PROJECT_ID,
  defaultMetricsSettings,
  toMetricsInput,
} from '@/lib/metrics/adapter'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import { monthPeriod } from '@/lib/metrics/period'
import type { Client, WorkEntry } from '@/lib/types'

const AUG = monthPeriod(2026, 7)
const TODAY = '2026-08-22'

const hourlyClient: Client = {
  id: 'c1',
  user_id: 'u1',
  name: 'Klient PLN',
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
  color: '#fff',
  created_at: '2026-01-01',
}

const pieceworkClient: Client = {
  ...hourlyClient,
  id: 'c2',
  name: 'Klient akordowy',
  work_type: 'piecework',
  rate: 12.5,
  is_default: false,
}

function workEntry(over: Partial<WorkEntry> & { date: string }): WorkEntry {
  return {
    id: over.date + (over.entry_kind ?? 'real'),
    user_id: 'u1',
    client_id: 'c1',
    project_id: 'p1',
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
    created_at: '2026-01-01',
    ...over,
  }
}

function build(workEntries: WorkEntry[], clients: Client[] = [hourlyClient]) {
  return toMetricsInput({
    period: AUG,
    today: TODAY,
    workEntries,
    clients,
    settings: defaultMetricsSettings(4.3),
  })
}

describe('toMetricsInput', () => {
  it('rozdziela wpisy pracy od nieobecności', () => {
    const input = build([
      workEntry({ date: '2026-08-03' }),
      workEntry({ date: '2026-08-04', status: 'vacation', hours: null }),
      workEntry({ date: '2026-08-05', status: 'sick_leave', hours: null }),
      workEntry({ date: '2026-08-06', status: 'day_off', hours: null }),
      workEntry({ date: '2026-08-07', status: 'not_worked', hours: null }),
    ])

    expect(input.entries).toHaveLength(1)
    expect(input.absences).toEqual([
      { date: '2026-08-04', kind: 'vacation' },
      { date: '2026-08-05', kind: 'sick' },
      { date: '2026-08-06', kind: 'dayOff' },
      { date: '2026-08-07', kind: 'dayOff' },
    ])
  })

  it('bierze stawkę klienta w groszach', () => {
    const [entry] = build([workEntry({ date: '2026-08-03' })]).entries

    expect(entry.rateMinor).toBe(10_000)
    expect(entry.amountMinor).toBeNull()
    expect(entry.currency).toBe('PLN')
  })

  it('snapshot stawki na wpisie wygrywa z aktualną stawką klienta', () => {
    const [entry] = build([
      workEntry({ date: '2026-08-03', billing_rate: 30, billing_currency: 'EUR' }),
    ]).entries

    expect(entry.rateMinor).toBe(3_000)
    expect(entry.currency).toBe('EUR')
  })

  it('akord dostaje gotową kwotę zamiast stawki godzinowej', () => {
    const [entry] = build(
      [
        workEntry({
          date: '2026-08-03',
          client_id: 'c2',
          quantity_from: 100,
          quantity_to: 140,
        }),
      ],
      [hourlyClient, pieceworkClient],
    ).entries

    expect(entry.rateMinor).toBeNull()
    expect(entry.amountMinor).toBe(50_000) // 40 sztuk × 12,50 zł
  })

  it('wpis bez projektu trafia do wspólnego kubełka', () => {
    const [entry] = build([workEntry({ date: '2026-08-03', project_id: null })]).entries

    expect(entry.projectId).toBe(UNASSIGNED_PROJECT_ID)
  })

  it('brak entry_kind znaczy wpis potwierdzony', () => {
    const [entry] = build([
      workEntry({ date: '2026-08-03', entry_kind: undefined }),
    ]).entries

    expect(entry.kind).toBe('real')
  })
})

describe('defaultMetricsSettings', () => {
  it('zamienia kurs EUR na punkty bazowe', () => {
    expect(defaultMetricsSettings(4.3).eurRateBps).toBe(43_000)
  })
})

describe('adapter + computeMonthMetrics', () => {
  it('liczy realny miesiąc od surowych wpisów', () => {
    const metrics = computeMonthMetrics(
      build([
        workEntry({ date: '2026-08-03', hours: 8 }),
        workEntry({ date: '2026-08-04', hours: 8 }),
        workEntry({ date: '2026-08-05', status: 'vacation', hours: null }),
        workEntry({ date: '2026-08-08', hours: 4 }), // sobota
        workEntry({ date: '2026-08-25', hours: 8, entry_kind: 'predicted' }),
      ]),
    )

    expect(metrics.hours.actual).toBe(20)
    expect(metrics.earnings.actualMinor).toBe(200_000) // 20 h × 100 zł
    expect(metrics.effectiveRateMinorPerHour).toBe(10_000)
    expect(metrics.days.worked).toBe(4)
    expect(metrics.days.vacation).toBe(1)
    expect(
      metrics.days.worked +
        metrics.days.vacation +
        metrics.days.sick +
        metrics.days.dayOff +
        metrics.days.weekendIdle +
        metrics.days.weekdayIdle,
    ).toBe(31)
  })
})
