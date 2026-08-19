import { createClient } from '@supabase/supabase-js'

/**
 * Zaklada uzytkownika testowego i czysci jego dane.
 * Uzywa klucza service-role, wiec dziala TYLKO lokalnie / w CI na bazie testowej.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

if (!url || !serviceKey || !email || !password) {
  throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / E2E_USER_*')
}
if (!/localhost|127\.0\.0\.1|\.local/.test(url)) {
  throw new Error(`Odmowa seedowania na ${url} — seed dziala tylko na bazie lokalnej`)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function findUser(): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  return data.users.find((u) => u.email === email)?.id ?? null
}

async function main() {
  let userId = await findUser()

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Tester' },
    })
    if (error) throw error
    userId = data.user.id
  }

  // Deterministyczny punkt startowy: kazdy przebieg zaczyna od tego samego stanu.
  // `invoice_sequence_counters` jest tu obowiazkowe — licznik numerow faktur
  // przezylby kasowanie samych faktur i kolejny przebieg zaczalby od FV 3/…,
  // przez co test numeracji sprawdzalby inny stan niz poprzednio.
  for (const table of [
    'invoice_line_items',
    'invoices',
    'invoice_sequence_counters',
    'work_entries',
    'projects',
    'clients',
  ]) {
    const { error } = await admin.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(`czyszczenie ${table}: ${error.message}`)
  }

  const { data: client, error: clientError } = await admin
    .from('clients')
    .insert({
      user_id: userId,
      name: 'E2E Klient Testowy',
      // Stawka godzinowa jest tu istotna: `DayEntryDialog` pokazuje pole
      // "Godziny" tylko dla work_type === 'hourly'.
      work_type: 'hourly',
      rate: 100,
      currency: 'PLN',
      unit: 'h',
    })
    .select('id')
    .single()
  if (clientError) throw clientError

  const { error: projectError } = await admin
    .from('projects')
    .insert({ user_id: userId, client_id: client.id, name: 'E2E Projekt', status: 'active' })
  if (projectError) throw projectError

  console.log(`[e2e:seed] gotowe — user ${userId}, klient ${client.id}`)
}

main().catch((error) => {
  console.error('[e2e:seed]', error)
  process.exit(1)
})
