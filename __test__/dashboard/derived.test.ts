import { describe, it, expect } from 'vitest'
import {
  computeDashboardDerived,
  filterByDateRange,
  type DashboardDerivedInput,
} from '@/features/dashboard/lib/derived'
import type { Client, WorkEntry } from '@/lib/types'

const TODAY = '2026-06-15'

function client(over: Partial<Client> & { id: string; name: string }): Client {
  return {
    user_id: 'u1',
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
    unit: 'h',
    is_default: false,
    color: '#fff',
    created_at: TODAY,
    ...over,
  }
}

function entry(over: Partial<WorkEntry> & { date: string }): WorkEntry {
  return {
    id: `e-${over.date}-${over.client_id ?? 'x'}`,
    user_id: 'u1',
    client_id: null,
    project_id: null,
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
    created_at: TODAY,
    ...over,
  }
}

const ACME = client({ id: 'c1', name: 'Acme' })

/** Czerwiec 2026 z majem jako okresem poprzednim — tak jak liczy getPrevRange. */
function input(over: Partial<DashboardDerivedInput> = {}): DashboardDerivedInput {
  return {
    workEntries: [],
    clients: [ACME],
    dateRange: { from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) },
    prevRange: { from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) },
    range: 'current_month',
    eurRate: 4,
    todayIso: TODAY,
    ...over,
  }
}

const dates = (entries: WorkEntry[]) => entries.map((e) => e.date)

describe('filterByDateRange', () => {
  it('bierze wpisy z pierwszego i ostatniego dnia, gdy granice niosa godzine', () => {
    const entries = [
      entry({ date: '2026-05-31' }),
      entry({ date: '2026-06-01' }),
      entry({ date: '2026-06-15' }),
      entry({ date: '2026-06-30' }),
      entry({ date: '2026-07-01' }),
    ]

    // Zakres zbudowany z `new Date()` niesie godzine z srodka dnia. Bez
    // normalizacji granic do 00:00 / 23:59:59.999 wpisy z brzegowych dni
    // wypadaja z zakresu — data wpisu to zawsze polnoc.
    const filtered = filterByDateRange(entries, {
      from: new Date(2026, 5, 1, 15, 30),
      to: new Date(2026, 5, 30, 9, 15),
    })

    expect(dates(filtered)).toEqual(['2026-06-01', '2026-06-15', '2026-06-30'])
  })

  it('zwraca ten sam zbior, gdy zakres jest otwarty', () => {
    const entries = [entry({ date: '2020-01-01' }), entry({ date: '2030-12-31' })]

    expect(filterByDateRange(entries, { from: null, to: null })).toBe(entries)
    expect(filterByDateRange(entries, { from: new Date(2026, 5, 1), to: null })).toBe(entries)
  })
})

describe('computeDashboardDerived', () => {
  it('rozdziela zrealizowane i planowane po dacie oraz po entry_kind', () => {
    const workEntries = [
      entry({ date: '2026-06-10', client_id: 'c1' }), // przeszlosc + real
      entry({ date: '2026-06-15', client_id: 'c1' }), // dzis wlacznie → zrealizowany
      entry({ date: '2026-06-20', client_id: 'c1' }), // przyszlosc → plan
      entry({ date: '2026-06-05', client_id: 'c1', entry_kind: 'predicted' }), // plan mimo przeszlej daty
    ]

    const derived = computeDashboardDerived(input({ workEntries }))

    expect(dates(derived.filtered)).toHaveLength(4)
    expect(dates(derived.realized)).toEqual(['2026-06-10', '2026-06-15'])
    expect(dates(derived.predicted)).toEqual(['2026-06-20', '2026-06-05'])
  })

  it('liczy totals ze zrealizowanych, nie z filtered', () => {
    const workEntries = [
      entry({ date: '2026-06-10', client_id: 'c1', hours: 8 }),
      entry({ date: '2026-06-20', client_id: 'c1', hours: 8 }), // plan na przyszlosc
    ]

    const derived = computeDashboardDerived(input({ workEntries }))

    // Wpis planowany nie moze podbic faktycznych KPI.
    expect(derived.filtered).toHaveLength(2)
    expect(derived.totals.totalHours).toBe(8)
    expect(derived.totals.earningsPLN).toBe(800)
    expect(derived.predictedTotals.totalHours).toBe(8)
  })

  it('bierze prevRealized z prevRange, a nie z dateRange', () => {
    const workEntries = [
      entry({ date: '2026-06-10', client_id: 'c1' }),
      entry({ date: '2026-05-10', client_id: 'c1' }),
      entry({ date: '2026-04-10', client_id: 'c1' }), // poza oboma zakresami
    ]

    const derived = computeDashboardDerived(input({ workEntries }))

    expect(dates(derived.realized)).toEqual(['2026-06-10'])
    expect(dates(derived.prevFiltered)).toEqual(['2026-05-10'])
    expect(dates(derived.prevRealized)).toEqual(['2026-05-10'])
  })

  it('realizedAll ignoruje zakres, ale nadal odsiewa plan', () => {
    const workEntries = [
      entry({ date: '2026-06-10', client_id: 'c1' }),
      entry({ date: '2026-01-10', client_id: 'c1' }), // spoza zakresu
      entry({ date: '2026-06-20', client_id: 'c1' }), // plan na przyszlosc
    ]

    const derived = computeDashboardDerived(input({ workEntries }))

    // Sekcja Projekty buduje z tego liste projektow "kiedykolwiek" — zakres
    // decyduje tylko o tym, ktore z nich sa aktywne.
    expect(dates(derived.realizedAll)).toEqual(['2026-06-10', '2026-01-10'])
  })

  it('zwraca etykiete okresu dla znanego range i pusty string dla nieznanego', () => {
    expect(computeDashboardDerived(input({ range: 'current_month' })).periodLabel).toBe(
      'Obecny miesiąc',
    )
    expect(computeDashboardDerived(input({ range: 'all' })).periodLabel).toBe('Wszystko')
    expect(
      computeDashboardDerived(
        input({ range: 'nie_istnieje' as DashboardDerivedInput['range'] }),
      ).periodLabel,
    ).toBe('')
  })
})
