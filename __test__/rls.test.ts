/**
 * #8 — Testy RLS policies w Supabase
 *
 * Cel: weryfikacja że user A nie może odczytać/zmienić danych usera B.
 * Nie ufamy tylko frontendowi — RLS musi blokować na poziomie bazy.
 *
 * Stack: Vitest + @supabase/supabase-js (prawdziwy klient, nie mock)
 * Środowisko: supabase local (docker) lub Test project
 *
 * Uruchomienie:
 *   supabase start              # lokalny docker
 *   vitest run rls.test.ts
 *
 * ENV wymagane (tylko w testach — nie NEXT_PUBLIC_!):
 *   TEST_SUPABASE_URL
 *   TEST_SUPABASE_ANON_KEY
 *   TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD
 *   TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Test helpers ──────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.TEST_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY!

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`)
  return client
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

let clientA: SupabaseClient
let clientB: SupabaseClient
let userAId: string
let userBId: string

// IDs wpisów stworzonych przez usera A (do sprzątania po testach)
const createdByA: { table: string; id: string }[] = []

beforeAll(async () => {
  clientA = await signIn(
    process.env.TEST_USER_A_EMAIL!,
    process.env.TEST_USER_A_PASSWORD!,
  )
  clientB = await signIn(
    process.env.TEST_USER_B_EMAIL!,
    process.env.TEST_USER_B_PASSWORD!,
  )

  const { data: { user: uA } } = await clientA.auth.getUser()
  const { data: { user: uB } } = await clientB.auth.getUser()

  userAId = uA!.id
  userBId = uB!.id
})

afterAll(async () => {
  // Sprząta dane testowe usera A
  for (const { table, id } of createdByA) {
    await clientA.from(table).delete().eq('id', id)
  }
  await clientA.auth.signOut()
  await clientB.auth.signOut()
})

// ── work_entries ──────────────────────────────────────────────────────────────

describe('RLS: work_entries', () => {
  let entryAId: string

  it('user A może INSERT własny wpis', async () => {
    const { data, error } = await clientA
      .from('work_entries')
      .insert({ user_id: userAId, date: '2024-01-15', status: 'worked', hours: 8 })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeDefined()
    entryAId = data!.id
    createdByA.push({ table: 'work_entries', id: entryAId })
  })

  it('user A widzi TYLKO swoje wpisy (SELECT)', async () => {
    const { data, error } = await clientA.from('work_entries').select('id, user_id')
    expect(error).toBeNull()
    expect(data?.every((e) => e.user_id === userAId)).toBe(true)
  })

  it('user B NIE widzi wpisów usera A (SELECT)', async () => {
    const { data, error } = await clientB
      .from('work_entries')
      .select('id')
      .eq('id', entryAId)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)  // RLS filtruje — brak rekordu, nie 403
  })

  it('user B NIE może UPDATE wpisu usera A', async () => {
    const { count } = await clientB
      .from('work_entries')
      // `count: 'exact'` jest obowiazkowe — bez niego PostgREST nie odsyla
      // Content-Range i `count` przychodzi jako null, wiec asercja nie
      // sprawdzalaby niczego.
      .update({ hours: 99 }, { count: 'exact' })
      .eq('id', entryAId)

    // Supabase RLS: brak błędu (polityka filtruje), ale 0 wierszy zmienionych
    expect(count).toBe(0)

    // Weryfikacja że dane faktycznie się nie zmieniły
    const { data } = await clientA
      .from('work_entries')
      .select('hours')
      .eq('id', entryAId)
      .single()
    expect(data?.hours).toBe(8)
  })

  it('user B NIE może DELETE wpisu usera A', async () => {
    const { count } = await clientB
      .from('work_entries')
      .delete({ count: 'exact' })
      .eq('id', entryAId)

    expect(count).toBe(0)

    // Wpis nadal istnieje
    const { data } = await clientA
      .from('work_entries')
      .select('id')
      .eq('id', entryAId)
      .single()
    expect(data?.id).toBe(entryAId)
  })

  it('user A NIE może INSERT z cudzym user_id', async () => {
    const { error } = await clientA
      .from('work_entries')
      .insert({ user_id: userBId, date: '2024-01-16', status: 'worked', hours: 8 })

    // Powinno fail — RLS policy: user_id = auth.uid()
    expect(error).not.toBeNull()
    expect(error?.code).toMatch(/42501|23503|403/)  // permission denied lub FK
  })
})

// ── invoices ──────────────────────────────────────────────────────────────────

describe('RLS: invoices', () => {
  let invoiceAId: string

  it('user A może INSERT własną fakturę', async () => {
    const { data, error } = await clientA
      .from('invoices')
      .insert({
        user_id:      userAId,
        name:         'Test Invoice',
        invoice_date: '2024-01-15',
        amount:       1000,
        currency:     'PLN',
        is_paid:      false,
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    invoiceAId = data!.id
    createdByA.push({ table: 'invoices', id: invoiceAId })
  })

  it('user B NIE widzi faktur usera A', async () => {
    const { data } = await clientB
      .from('invoices')
      .select('id')
      .eq('id', invoiceAId)

    expect(data).toHaveLength(0)
  })

  it('user B NIE może oznaczyć faktury A jako zapłaconej', async () => {
    const { count } = await clientB
      .from('invoices')
      .update({ is_paid: true }, { count: 'exact' })
      .eq('id', invoiceAId)

    expect(count).toBe(0)

    const { data } = await clientA
      .from('invoices')
      .select('is_paid')
      .eq('id', invoiceAId)
      .single()
    expect(data?.is_paid).toBe(false)
  })
})

// ── clients ───────────────────────────────────────────────────────────────────

describe('RLS: clients', () => {
  it('user A widzi tylko swoich klientów', async () => {
    const { data, error } = await clientA.from('clients').select('user_id')
    expect(error).toBeNull()
    expect(data?.every((c) => c.user_id === userAId)).toBe(true)
  })

  it('user B widzi tylko swoich klientów', async () => {
    const { data, error } = await clientB.from('clients').select('user_id')
    expect(error).toBeNull()
    expect(data?.every((c) => c.user_id === userBId)).toBe(true)
  })
})
// ── work automation ───────────────────────────────────────────────────────────

/**
 * Automat zapisu pracy: uprawnienia i wspolbieznosc na prawdziwej bazie.
 *
 * Atrapa nie sprawdzi ani polityk RLS, ani UNIQUE (user_id, date, entry_kind) —
 * a to one, a nie kod aplikacji, gwarantuja jeden realny wpis na dzien.
 */
describe('RLS: work_automation_settings', () => {
  const WEEK_SCHEDULE = {
    mon: { enabled: true, hours: 10 },
    tue: { enabled: true, hours: 10 },
    wed: { enabled: true, hours: 10 },
    thu: { enabled: true, hours: 10 },
    fri: { enabled: true, hours: 10 },
    sat: { enabled: true, hours: 8 },
    sun: { enabled: false, hours: 8 },
  }

  const config = (userId: string) => ({
    user_id: userId,
    enabled: false,
    start_date: '2026-09-01',
    run_time: '19:00',
    time_zone: 'Europe/Warsaw',
    week_schedule: WEEK_SCHEDULE,
  })

  afterAll(async () => {
    await clientA.from('work_automation_settings').delete().eq('user_id', userAId)
  })

  it('user A zapisuje własną konfigurację', async () => {
    const { error } = await clientA
      .from('work_automation_settings')
      .upsert(config(userAId), { onConflict: 'user_id' })

    expect(error).toBeNull()
  })

  it('zapis konfiguracji zostawia wersję w historii', async () => {
    const { data, error } = await clientA
      .from('work_automation_setting_versions')
      .select('user_id, enabled, run_time')
      .eq('user_id', userAId)

    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThan(0)
    expect(data?.every((row) => row.user_id === userAId)).toBe(true)
  })

  it('user B NIE widzi konfiguracji usera A', async () => {
    const { data } = await clientB
      .from('work_automation_settings')
      .select('user_id')
      .eq('user_id', userAId)

    expect(data).toHaveLength(0)
  })

  it('user B NIE może zapisać konfiguracji pod user_id usera A', async () => {
    const { error } = await clientB
      .from('work_automation_settings')
      .insert(config(userAId))

    expect(error).not.toBeNull()
    expect(error?.code).toMatch(/42501|23505|403/)
  })

  it('user B NIE może zmienić konfiguracji usera A', async () => {
    const { count } = await clientB
      .from('work_automation_settings')
      .update({ enabled: true }, { count: 'exact' })
      .eq('user_id', userAId)

    expect(count).toBe(0)
  })

  it('dziennik decyzji jest tylko do odczytu — zapisuje go wyłącznie cron', async () => {
    const { error } = await clientA.from('work_automation_runs').insert({
      user_id: userAId,
      local_date: '2026-09-08',
      outcome: 'created',
      reason: 'created',
    })

    expect(error).not.toBeNull()
    expect(error?.code).toMatch(/42501|403/)
  })

  it('user B NIE widzi wznowień pracy usera A', async () => {
    const { error: insertError } = await clientA
      .from('work_automation_resumptions')
      .upsert(
        { user_id: userAId, resume_date: '2026-09-07' },
        { onConflict: 'user_id,resume_date' },
      )
    expect(insertError).toBeNull()

    const { data } = await clientB
      .from('work_automation_resumptions')
      .select('id')
      .eq('user_id', userAId)

    expect(data).toHaveLength(0)

    await clientA.from('work_automation_resumptions').delete().eq('user_id', userAId)
  })
})

describe('współbieżność: jeden realny wpis na dzień', () => {
  const DATE = '2024-02-29'

  afterAll(async () => {
    await clientA.from('work_entries').delete().eq('user_id', userAId).eq('date', DATE)
  })

  it('dwa równoległe zapisy tej samej daty dają jeden wpis i jeden konflikt', async () => {
    const insert = () =>
      clientA
        .from('work_entries')
        .insert({
          user_id: userAId,
          date: DATE,
          status: 'worked',
          entry_kind: 'real',
          source: 'automation',
          hours: 10,
        })
        .select('id')
        .single()

    const results = await Promise.all([insert(), insert()])

    const inserted = results.filter((result) => result.error === null)
    const conflicts = results.filter((result) => result.error?.code === '23505')

    expect(inserted).toHaveLength(1)
    expect(conflicts).toHaveLength(1)

    const { data } = await clientA
      .from('work_entries')
      .select('id')
      .eq('user_id', userAId)
      .eq('date', DATE)
      .eq('entry_kind', 'real')

    expect(data).toHaveLength(1)
  })

  it('plan na tę samą datę nadal jest dozwolony', async () => {
    const { data, error } = await clientA
      .from('work_entries')
      .insert({
        user_id: userAId,
        date: DATE,
        status: 'worked',
        entry_kind: 'predicted',
        hours: 12,
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeDefined()
  })
})

describe('utrata klienta zatrzymuje automat', () => {
  afterAll(async () => {
    await clientA.from('work_automation_settings').delete().eq('user_id', userAId)
  })

  it('usunięcie skonfigurowanego klienta wyłącza automat z widocznym powodem', async () => {
    const { data: created, error: clientError } = await clientA
      .from('clients')
      .insert({ user_id: userAId, name: 'Automat — klient testowy', rate: 100, currency: 'PLN' })
      .select('id')
      .single()

    expect(clientError).toBeNull()

    const { error: settingsError } = await clientA.from('work_automation_settings').upsert(
      {
        user_id: userAId,
        enabled: true,
        start_date: '2026-09-01',
        run_time: '19:00',
        time_zone: 'Europe/Warsaw',
        week_schedule: {
          mon: { enabled: true, hours: 10 },
          tue: { enabled: true, hours: 10 },
          wed: { enabled: true, hours: 10 },
          thu: { enabled: true, hours: 10 },
          fri: { enabled: true, hours: 10 },
          sat: { enabled: true, hours: 8 },
          sun: { enabled: false, hours: 8 },
        },
        client_id: created!.id,
      },
      { onConflict: 'user_id' },
    )
    expect(settingsError).toBeNull()

    const { error: deleteError } = await clientA.from('clients').delete().eq('id', created!.id)
    expect(deleteError).toBeNull()

    const { data } = await clientA
      .from('work_automation_settings')
      .select('enabled, client_id, disabled_reason')
      .eq('user_id', userAId)
      .single()

    expect(data).toMatchObject({
      enabled: false,
      client_id: null,
      disabled_reason: 'client_deleted',
    })
  })
})
