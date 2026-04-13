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
    const { error, count } = await clientB
      .from('work_entries')
      .update({ hours: 99 })
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
      .delete()
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
        user_id:  userAId,
        name:     'Test Invoice',
        amount:   1000,
        currency: 'PLN',
        is_paid:  false,
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
      .update({ is_paid: true })
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