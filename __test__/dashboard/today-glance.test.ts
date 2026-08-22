import { describe, expect, it } from 'vitest'
import { computeTodayGlance } from '@/features/dashboard/lib/today'
import type { Client, WorkEntry } from '@/lib/types'

const TODAY = '2026-08-22'

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
    id: `e-${over.date}`,
    user_id: 'u1',
    client_id: 'c1',
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


describe('computeTodayGlance', () => {
  it('sumuje wylacznie godziny z dzisiaj', () => {
    const glance = computeTodayGlance({
      workEntries: [
        entry({ date: TODAY, hours: 6 }),
        entry({ date: '2026-08-21', hours: 8 }),
      ],
      clients: [client({ id: 'c1', name: 'Klient A' })],
      eurRate: 4.3,
      todayIso: TODAY,
    })
    expect(glance.hours).toBe(6)
  })

  it('brak wpisu na dzis to zero godzin, nie wyjatek', () => {
    const glance = computeTodayGlance({
      workEntries: [],
      clients: [],
      eurRate: 4.3,
      todayIso: TODAY,
    })
    expect(glance.hours).toBe(0)
    expect(glance.defaultClientName).toBeNull()
  })

  it('podaje domyslnego klienta i norme dobowa dla akcji glownej', () => {
    const glance = computeTodayGlance({
      workEntries: [],
      clients: [
        client({ id: 'c1', name: 'Klient A' }),
        client({ id: 'c2', name: 'Klient B', is_default: true }),
      ],
      eurRate: 4.3,
      todayIso: TODAY,
    })
    expect(glance.defaultClientName).toBe('Klient B')
    expect(glance.normHours).toBe(8)
  })
})
