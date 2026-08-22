import { describe, expect, it } from 'vitest'
import { computeDashboardDerived } from '@/features/dashboard/lib/derived'
import { defaultMetricsSettings, toMetricsInput } from '@/lib/metrics/adapter'
import { computeMonthMetrics } from '@/lib/metrics/computeMonthMetrics'
import { monthPeriod } from '@/lib/metrics/period'
import type { Client, WorkEntry } from '@/lib/types'

/**
 * Regresja na buga z 22.08.2026: Kalendarz pokazywał 240,0 h / cel 160 h /
 * seria 20 dni / 35 dni w 31-dniowym miesiącu, a Pulpit w tym samym momencie
 * 182,0 h / cel 168 h / seria 6 dni / stawkę 0,00 €/h przy 18 200 zł przychodu.
 *
 * Oba ekrany liczą teraz tym samym silnikiem, więc test porównuje ich wyjścia
 * wprost — rozjazd nie ma jak przejść przez CI.
 */

const TODAY = '2026-08-22'
const EUR_RATE = 4.3

const client: Client = {
  id: 'c1',
  user_id: 'u1',
  name: 'Klient',
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

function workEntry(over: Partial<WorkEntry> & { date: string }): WorkEntry {
  return {
    id: `${over.date}-${over.entry_kind ?? 'real'}`,
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

/** Sierpień 2026 z weekendową pracą, urlopem i planem na przyszłość. */
const ENTRIES: WorkEntry[] = [
  ...['03', '04', '05', '06', '07'].map((d) => workEntry({ date: `2026-08-${d}` })),
  workEntry({ date: '2026-08-08', hours: 4 }), // sobota
  ...['10', '11', '12', '13', '14'].map((d) => workEntry({ date: `2026-08-${d}` })),
  workEntry({ date: '2026-08-17', status: 'vacation', hours: null }),
  ...['18', '19', '20', '21'].map((d) => workEntry({ date: `2026-08-${d}` })),
  ...['24', '25', '26'].map((d) =>
    workEntry({ date: `2026-08-${d}`, entry_kind: 'predicted' }),
  ),
]

describe('Pulpit i Kalendarz liczą to samo', () => {
  const calendar = computeMonthMetrics(
    toMetricsInput({
      period: monthPeriod(2026, 7),
      today: TODAY,
      workEntries: ENTRIES,
      clients: [client],
      settings: defaultMetricsSettings(EUR_RATE),
    }),
  )

  const dashboard = computeDashboardDerived({
    workEntries: ENTRIES,
    clients: [client],
    dateRange: { from: new Date(2026, 7, 1), to: new Date(2026, 7, 31) },
    prevRange: { from: new Date(2026, 6, 1), to: new Date(2026, 6, 31) },
    range: 'current_month',
    eurRate: EUR_RATE,
    todayIso: TODAY,
  }).metrics

  it('godziny, cel i postęp są identyczne', () => {
    expect(dashboard.hours).toEqual(calendar.hours)
  })

  it('seria jest identyczna', () => {
    expect(dashboard.currentStreakDays).toBe(calendar.currentStreakDays)
    expect(dashboard.longestStreakDays).toBe(calendar.longestStreakDays)
  })

  it('stawka efektywna i kwoty są identyczne', () => {
    expect(dashboard.effectiveRateMinorPerHour).toBe(
      calendar.effectiveRateMinorPerHour,
    )
    expect(dashboard.earnings).toEqual(calendar.earnings)
  })

  it('struktura dni jest identyczna i domyka się do długości miesiąca', () => {
    expect(dashboard.days).toEqual(calendar.days)
    const { totalDays, ...buckets } = calendar.days
    expect(Object.values(buckets).reduce((a, b) => a + b, 0)).toBe(totalDays)
  })

  it('stawka efektywna klienta w PLN nie jest zerem', () => {
    expect(calendar.earnings.actualMinor).toBeGreaterThan(0)
    expect(calendar.effectiveRateMinorPerHour).toBe(10_000)
  })

  it('cel wynika z dni roboczych miesiąca, nie ze stałej 160 h', () => {
    expect(calendar.hours.goal).toBe(21 * 8)
  })

  it('godziny faktyczne nie zawierają planu na przyszłość', () => {
    // 14 pełnych dni × 8 h + sobota 4 h; urlop i trzy dni planu poza sumą.
    expect(calendar.hours.actual).toBe(14 * 8 + 4)
  })
})
