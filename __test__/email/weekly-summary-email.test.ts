import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { renderWeeklySummaryEmail } from '@/features/dashboard/server'
import { buildWeeklySummary } from '@/features/dashboard/lib/weekly-summary'
import { formatWeeklySummaryText } from '@/features/dashboard/components/sections/weekly-summary/format'
import { isSentForWeek } from '@/lib/email/weekly-summary-dispatch'
import { weeklySummaryEmailSchema } from '@/features/settings/domain'
import type { Client, Project, WorkEntry } from '@/lib/types'

// Sobota 22.08.2026, 12:00 — tydzien ISO 34 (17.08–23.08), czyli ten sam,
// ktory automat wysyla w sobotni wieczor.
const NOW = new Date(2026, 7, 22, 12, 0, 0)

const CLIENT = {
  id: 'c1',
  user_id: 'u1',
  name: 'SPAW-MONT Czernicki Łukasz',
  nip: '6112234309',
  work_type: 'hourly',
  rate: 100,
  currency: 'PLN',
  unit: 'h',
  is_default: true,
  color: '#fff',
  created_at: '2026-01-01',
} as unknown as Client

const PROJECT = {
  id: 'p1',
  user_id: 'u1',
  client_id: 'c1',
  name: 'Flensburg',
  address: 'Husumer Str. 12, 24941 Flensburg',
} as unknown as Project

function entry(date: string, hours: number): WorkEntry {
  return {
    id: `e-${date}`,
    user_id: 'u1',
    client_id: 'c1',
    project_id: 'p1',
    date,
    status: 'worked',
    entry_kind: 'real',
    hours,
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

const ENTRIES = [entry('2026-08-17', 10), entry('2026-08-18', 10), entry('2026-08-19', 9)]

/**
 * Atrapa klienta Supabase: kazde ogniwo lancucha zwraca siebie, a `limit`
 * konczy zapytanie danymi tabeli. Tyle wystarczy, bo serwis nie robi nic
 * poza trzema odczytami.
 */
function fakeSupabase(tables: Record<string, unknown[]>): SupabaseClient {
  const seen: string[] = []
  const client = {
    seen,
    from(table: string) {
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          seen.push(`${table}.${column}=${String(value)}`)
          return builder
        },
        gte: () => builder,
        lte: () => builder,
        limit: () => Promise.resolve({ data: tables[table] ?? [], error: null }),
      }
      return builder
    },
  }
  return client as unknown as SupabaseClient
}

describe('renderWeeklySummaryEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('wysyla dokladnie ten sam tekst, co przycisk „Kopiuj"', async () => {
    const supabase = fakeSupabase({
      work_entries: ENTRIES,
      clients: [CLIENT],
      projects: [PROJECT],
    })

    const email = await renderWeeklySummaryEmail(supabase, 'u1')
    const copied = formatWeeklySummaryText(
      buildWeeklySummary(ENTRIES, [CLIENT], NOW, undefined, [PROJECT]),
    )

    expect(email.text).toBe(copied)
  })

  it('bierze temat z naglowka raportu — KW i zakres dat', async () => {
    const supabase = fakeSupabase({
      work_entries: ENTRIES,
      clients: [CLIENT],
      projects: [PROJECT],
    })

    const email = await renderWeeklySummaryEmail(supabase, 'u1')

    expect(email.subject).toBe('Podsumowanie tygodnia KW 34/2026 (17-23.08.2026)')
    expect(email.weekNumber).toBe(34)
    expect(email.weekYear).toBe(2026)
    expect(email.isEmpty).toBe(false)
  })

  it('zaweza kazdy odczyt do wlasciciela — klucz service-role omija RLS', async () => {
    const supabase = fakeSupabase({ work_entries: [], clients: [], projects: [] })
    await renderWeeklySummaryEmail(supabase, 'u1')

    expect((supabase as unknown as { seen: string[] }).seen).toEqual([
      'work_entries.user_id=u1',
      'clients.user_id=u1',
      'projects.user_id=u1',
    ])
  })

  it('melduje pusty tydzien zamiast wysylac pusty raport', async () => {
    const supabase = fakeSupabase({ work_entries: [], clients: [CLIENT], projects: [PROJECT] })

    const email = await renderWeeklySummaryEmail(supabase, 'u1')

    expect(email.isEmpty).toBe(true)
  })
})

describe('isSentForWeek', () => {
  const row = {
    user_id: 'u1',
    recipient_email: 'ksiegowa@example.com',
    last_sent_week_year: 2026,
    last_sent_week_number: 34,
  }

  it('blokuje dubel tego samego tygodnia', () => {
    expect(isSentForWeek(row, 2026, 34)).toBe(true)
  })

  it('przepuszcza kolejny tydzien i przelom roku', () => {
    expect(isSentForWeek(row, 2026, 35)).toBe(false)
    expect(isSentForWeek(row, 2027, 34)).toBe(false)
  })

  it('przepuszcza pierwsza w ogole wysylke', () => {
    expect(
      isSentForWeek({ ...row, last_sent_week_year: null, last_sent_week_number: null }, 2026, 34),
    ).toBe(false)
  })
})

describe('weeklySummaryEmailSchema', () => {
  it('normalizuje adres do malych liter bez spacji', () => {
    const parsed = weeklySummaryEmailSchema.parse({
      enabled: true,
      recipientEmail: '  Ksiegowa@Example.COM ',
    })
    expect(parsed.recipientEmail).toBe('ksiegowa@example.com')
  })

  it('nie pozwala wlaczyc automatu bez odbiorcy', () => {
    const result = weeklySummaryEmailSchema.safeParse({ enabled: true, recipientEmail: '' })
    expect(result.success).toBe(false)
  })

  it('pozwala zapisac pusty adres, dopoki automat jest wylaczony', () => {
    const result = weeklySummaryEmailSchema.safeParse({ enabled: false, recipientEmail: '' })
    expect(result.success).toBe(true)
  })

  it('odrzuca adres bez domeny', () => {
    const result = weeklySummaryEmailSchema.safeParse({ enabled: true, recipientEmail: 'ksiegowa@' })
    expect(result.success).toBe(false)
  })
})
