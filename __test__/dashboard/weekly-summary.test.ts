import { describe, it, expect } from 'vitest'
import { buildWeeklySummary } from '@/features/dashboard/lib/weekly-summary'
import { toMajor } from '@/lib/finance/money'
import type { Client, Project, WorkEntry } from '@/lib/types'

const TODAY = '2026-06-30' // po tygodniu, więc wpisy są „zrealizowane"
const WEEK = new Date(2026, 5, 3) // środa 03.06.2026 → tydzień 01.06–07.06

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

function project(over: Partial<Project> & { id: string }): Project {
  return {
    user_id: 'u1',
    client_id: 'c1',
    name: 'Projekt',
    description: null,
    address: null,
    status: 'in_progress',
    budget_type: 'hourly',
    budget_amount: null,
    target_quantity: null,
    current_quantity: 0,
    priority: 'medium',
    color: '#fff',
    start_date: null,
    end_date: null,
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

describe('buildWeeklySummary', () => {
  it('zwraca KW, zakres i pusty raport gdy brak pracy', () => {
    const summary = buildWeeklySummary([], [], WEEK, TODAY)
    expect(summary.weekNumber).toBe(23)
    expect(summary.weekYear).toBe(2026)
    expect(summary.from).toBe('2026-06-01')
    expect(summary.to).toBe('2026-06-07')
    expect(summary.isEmpty).toBe(true)
    expect(summary.contractors).toHaveLength(0)
  })

  it('grupuje jednego kontrahenta z zakresem dni, godzinami i kwotą', () => {
    const c = client({ id: 'c1', name: 'Acme', rate: 100, currency: 'PLN' })
    const entries = [
      entry({ date: '2026-06-01', client_id: 'c1', hours: 8 }),
      entry({ date: '2026-06-02', client_id: 'c1', hours: 6 }),
      entry({ date: '2026-06-03', client_id: 'c1', hours: 8 }),
    ]
    const { contractors } = buildWeeklySummary(entries, [c], WEEK, TODAY)
    expect(contractors).toHaveLength(1)
    const block = contractors[0]
    expect(block.clientName).toBe('Acme')
    expect(block.workedFrom).toBe('2026-06-01')
    expect(block.workedTo).toBe('2026-06-03')
    expect(block.workedDaysCount).toBe(3)
    expect(block.totalHours).toBe(22)
    expect(block.rates).toEqual([{ rate: 100, currency: 'PLN', workType: 'hourly', unit: null }])
    expect(toMajor(block.totals.PLN)).toBe(2200) // 22h × 100
    expect(toMajor(block.totals.EUR)).toBe(0)
  })

  it('pomija wpisy nie-worked, predicted i spoza tygodnia', () => {
    const c = client({ id: 'c1', name: 'Acme' })
    const entries = [
      entry({ date: '2026-06-02', client_id: 'c1', hours: 8 }), // OK
      entry({ date: '2026-06-02', client_id: 'c1', status: 'vacation' }), // pomijane
      entry({ date: '2026-06-04', client_id: 'c1', entry_kind: 'predicted' }), // pomijane
      entry({ date: '2026-05-31', client_id: 'c1', hours: 8 }), // poza tygodniem
      entry({ date: '2026-06-08', client_id: 'c1', hours: 8 }), // poza tygodniem
    ]
    const { contractors } = buildWeeklySummary(entries, [c], WEEK, TODAY)
    expect(contractors).toHaveLength(1)
    expect(contractors[0].totalHours).toBe(8)
    expect(contractors[0].workedDaysCount).toBe(1)
  })

  it('tworzy osobne bloki per kontrahent, a „Bez przypisania" na końcu', () => {
    const zeta = client({ id: 'c1', name: 'Zeta' })
    const acme = client({ id: 'c2', name: 'Acme' })
    const entries = [
      entry({ date: '2026-06-02', client_id: 'c1', hours: 8 }),
      entry({ date: '2026-06-02', client_id: 'c2', hours: 8 }),
      entry({ date: '2026-06-03', client_id: null, hours: 5 }),
    ]
    const { contractors } = buildWeeklySummary(entries, [zeta, acme], WEEK, TODAY)
    expect(contractors.map((b) => b.clientName)).toEqual(['Acme', 'Zeta', 'Bez przypisania'])
    expect(contractors[2].clientId).toBeNull()
    expect(contractors[2].client).toBeNull()
  })

  it('stawka z wpisu nadpisuje stawkę klienta i deduplikuje', () => {
    const c = client({ id: 'c1', name: 'Acme', rate: 100, currency: 'PLN' })
    const entries = [
      entry({ date: '2026-06-01', client_id: 'c1', hours: 8 }), // 100 z klienta
      entry({ date: '2026-06-02', client_id: 'c1', hours: 8 }), // 100 z klienta
      entry({
        date: '2026-06-03',
        client_id: 'c1',
        hours: 8,
        billing_rate: 25,
        billing_currency: 'EUR',
      }),
    ]
    const { contractors } = buildWeeklySummary(entries, [c], WEEK, TODAY)
    const block = contractors[0]
    expect(block.rates).toEqual([
      { rate: 100, currency: 'PLN', workType: 'hourly', unit: null },
      { rate: 25, currency: 'EUR', workType: 'hourly', unit: null },
    ])
    expect(toMajor(block.totals.PLN)).toBe(1600) // 16h × 100
    expect(toMajor(block.totals.EUR)).toBe(200) // 8h × 25
  })

  it('zbiera miejsca pracy (adres, a gdy brak — nazwa projektu) bez duplikatów', () => {
    const c = client({ id: 'c1', name: 'Acme' })
    const p1 = project({ id: 'p1', address: 'ul. Słoneczna 10, Gdańsk' })
    const p2 = project({ id: 'p2', address: 'ul. Morska 5, Gdynia' })
    const pNameOnly = project({ id: 'p3', name: 'Kramergasse 4-2, 47179 Duisburg', address: null })
    const entries = [
      entry({ date: '2026-06-01', client_id: 'c1', project_id: 'p1' }),
      entry({ date: '2026-06-02', client_id: 'c1', project_id: 'p1' }), // duplikat
      entry({ date: '2026-06-03', client_id: 'c1', project_id: 'p2' }),
      entry({ date: '2026-06-04', client_id: 'c1', project_id: 'p3' }), // brak adresu → nazwa
      entry({ date: '2026-06-05', client_id: 'c1', project_id: null }), // bez projektu
    ]
    const { contractors } = buildWeeklySummary(entries, [c], WEEK, TODAY, [p1, p2, pNameOnly])
    expect(contractors[0].workLocations).toEqual([
      'ul. Słoneczna 10, Gdańsk',
      'ul. Morska 5, Gdynia',
      'Kramergasse 4-2, 47179 Duisburg',
    ])
  })

  it('zwraca puste miejsca pracy gdy brak projektów', () => {
    const c = client({ id: 'c1', name: 'Acme' })
    const entries = [entry({ date: '2026-06-02', client_id: 'c1' })]
    const { contractors } = buildWeeklySummary(entries, [c], WEEK, TODAY)
    expect(contractors[0].workLocations).toEqual([])
  })
})
