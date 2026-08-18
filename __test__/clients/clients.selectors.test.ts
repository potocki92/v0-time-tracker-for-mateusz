import { describe, it, expect } from 'vitest'
import {
  deriveActivity,
  selectClientMonthStats,
  selectCurrentClient,
  sortClients,
} from '@/features/clients/domain/clients.selectors'
import type { ClientWithStats } from '@/features/clients/domain/clients.types'
import type { Client, WorkEntry } from '@/lib/types'

const NOW = new Date('2026-08-14T12:00:00Z').getTime()

function client(over: Partial<ClientWithStats> = {}): ClientWithStats {
  return {
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
    is_default: false,
    color: '#10b981',
    created_at: '2025-01-01',
    totalEarningsInClientCurrency: 0,
    totalHours: 0,
    totalDays: 0,
    workEntriesCount: 0,
    lastEntryDate: null,
    rateHistoryCount: 1,
    ...over,
  }
}

function entry(over: Partial<WorkEntry> = {}): WorkEntry {
  return {
    id: 'e1',
    user_id: 'u1',
    client_id: 'c1',
    project_id: null,
    date: '2026-08-10',
    status: 'worked',
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
    created_at: '2026-08-10',
    ...over,
  }
}

describe('deriveActivity', () => {
  it('klient bez wpisów jest nowy', () => {
    expect(deriveActivity(client(), NOW)).toBe('new')
  })

  it('klient z datą, ale bez wpisów, wciąż jest nowy', () => {
    expect(
      deriveActivity(client({ lastEntryDate: '2026-08-13', workEntriesCount: 0 }), NOW),
    ).toBe('new')
  })

  it('29 dni od ostatniego wpisu = aktywny', () => {
    expect(
      deriveActivity(client({ lastEntryDate: '2026-07-16', workEntriesCount: 3 }), NOW),
    ).toBe('active')
  })

  it('dokładnie 30 dni wciąż liczy się jako aktywny', () => {
    expect(
      deriveActivity(client({ lastEntryDate: '2026-07-15', workEntriesCount: 3 }), NOW),
    ).toBe('active')
  })

  it('31 dni = uśpiony', () => {
    expect(
      deriveActivity(client({ lastEntryDate: '2026-07-13', workEntriesCount: 3 }), NOW),
    ).toBe('dormant')
  })
})

describe('selectCurrentClient', () => {
  it('zwraca klienta z najświeższym wpisem', () => {
    const current = selectCurrentClient([
      client({ id: 'a', name: 'Stary', lastEntryDate: '2025-06-01', workEntriesCount: 40 }),
      client({ id: 'b', name: 'Świeży', lastEntryDate: '2026-08-14', workEntriesCount: 2 }),
      client({ id: 'c', name: 'Średni', lastEntryDate: '2026-03-01', workEntriesCount: 9 }),
    ])
    expect(current?.id).toBe('b')
  })

  it('zwraca null, gdy nikt nie ma wpisów', () => {
    expect(selectCurrentClient([client({ id: 'a' }), client({ id: 'b' })])).toBeNull()
  })

  it('zwraca null dla pustej listy', () => {
    expect(selectCurrentClient([])).toBeNull()
  })

  it('pomija klientów bez wpisów przy wyborze', () => {
    const current = selectCurrentClient([
      client({ id: 'a', lastEntryDate: null }),
      client({ id: 'b', lastEntryDate: '2026-01-01', workEntriesCount: 1 }),
    ])
    expect(current?.id).toBe('b')
  })

  it('remis rozstrzyga liczba wpisów', () => {
    const current = selectCurrentClient([
      client({ id: 'a', name: 'A', lastEntryDate: '2026-08-14', workEntriesCount: 1 }),
      client({ id: 'b', name: 'B', lastEntryDate: '2026-08-14', workEntriesCount: 7 }),
    ])
    expect(current?.id).toBe('b')
  })

  it('przy pełnym remisie wybór jest niezależny od kolejności wejścia', () => {
    const a = client({ id: 'a', name: 'Alfa', lastEntryDate: '2026-08-14', workEntriesCount: 3 })
    const b = client({ id: 'b', name: 'Beta', lastEntryDate: '2026-08-14', workEntriesCount: 3 })
    expect(selectCurrentClient([a, b])?.id).toBe('a')
    expect(selectCurrentClient([b, a])?.id).toBe('a')
  })
})

describe("sortClients — klucz 'recent'", () => {
  const withEntries = client({ id: 'a', name: 'A', lastEntryDate: '2026-08-01' })
  const older = client({ id: 'b', name: 'B', lastEntryDate: '2025-01-01' })
  const never = client({ id: 'c', name: 'C', lastEntryDate: null })

  it('desc: najświeższy pierwszy, bez wpisów na końcu', () => {
    const sorted = sortClients([never, older, withEntries], 'recent', 'desc')
    expect(sorted.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('asc: najstarszy pierwszy, ale bez wpisów NADAL na końcu', () => {
    const sorted = sortClients([never, withEntries, older], 'recent', 'asc')
    expect(sorted.map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })

  it('klienci bez wpisów układają się alfabetycznie', () => {
    const z = client({ id: 'z', name: 'Zenon', lastEntryDate: null })
    const m = client({ id: 'm', name: 'Marek', lastEntryDate: null })
    expect(sortClients([z, m], 'recent', 'desc').map((c) => c.id)).toEqual(['m', 'z'])
  })

  it('nie mutuje wejścia', () => {
    const input = [never, older, withEntries]
    sortClients(input, 'recent', 'desc')
    expect(input.map((c) => c.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('selectClientMonthStats', () => {
  const c: Client = client({ id: 'c1', rate: 100, currency: 'PLN', work_type: 'hourly' })
  const now = new Date('2026-08-14T12:00:00Z')

  it('liczy tylko bieżący miesiąc', () => {
    const stats = selectClientMonthStats(
      c,
      [
        entry({ id: '1', date: '2026-08-03', hours: 8 }),
        entry({ id: '2', date: '2026-08-10', hours: 4 }),
        entry({ id: '3', date: '2026-07-31', hours: 8 }),
      ],
      now,
    )
    expect(stats.hours).toBe(12)
    expect(stats.days).toBe(2)
    expect(stats.earnings).toBe(1200)
  })

  it('pomija wpisy o statusie innym niż worked', () => {
    const stats = selectClientMonthStats(
      c,
      [
        entry({ id: '1', date: '2026-08-03', hours: 8 }),
        entry({ id: '2', date: '2026-08-04', hours: 8, status: 'vacation' }),
        entry({ id: '3', date: '2026-08-05', hours: 8, status: 'sick_leave' }),
      ],
      now,
    )
    expect(stats.hours).toBe(8)
    expect(stats.days).toBe(1)
  })

  it('pomija wpisy innego klienta', () => {
    const stats = selectClientMonthStats(
      c,
      [
        entry({ id: '1', date: '2026-08-03', hours: 8 }),
        entry({ id: '2', date: '2026-08-04', hours: 8, client_id: 'inny' }),
      ],
      now,
    )
    expect(stats.hours).toBe(8)
  })

  it('zwraca zera, gdy w miesiącu nie ma nic', () => {
    const stats = selectClientMonthStats(c, [entry({ date: '2026-01-05' })], now)
    expect(stats).toEqual({ hours: 0, earnings: 0, days: 0 })
  })

  it('nie myli grudnia z listopadem przy dopasowaniu prefiksu', () => {
    const december = new Date('2026-12-15T12:00:00Z')
    const stats = selectClientMonthStats(
      c,
      [entry({ date: '2026-12-01', hours: 5 }), entry({ id: '2', date: '2026-11-01', hours: 5 })],
      december,
    )
    expect(stats.hours).toBe(5)
  })
})
