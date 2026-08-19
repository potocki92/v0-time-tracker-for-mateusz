import { createClient } from '@supabase/supabase-js'

/**
 * Zaklada uzytkownikow testowych i czysci ich dane.
 * Uzywa klucza service-role, wiec dziala TYLKO lokalnie / w CI na bazie testowej.
 *
 * Dwoch uzytkownikow, bo testy RLS (`__test__/rls.test.ts`) sprawdzaja, ze user A
 * nie widzi danych usera B — user B musi wiec miec wlasnego klienta i projekt,
 * inaczej "A nie widzi cudzych rekordow" przechodziloby na pustym zbiorze.
 * E2E loguje sie wylacznie jako user A.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Brak zmiennej ${name} — patrz e2e/README.md`)
  return value
}

if (!url || !serviceKey) {
  throw new Error('Brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
}
if (!/localhost|127\.0\.0\.1|\.local/.test(url)) {
  throw new Error(`Odmowa seedowania na ${url} — seed dziala tylko na bazie lokalnej`)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

interface SeedUser {
  email: string
  password: string
  fullName: string
  /** Kolumny klienta zakladanego dla tego uzytkownika. */
  client: Record<string, unknown>
  projectName: string
}

async function ensureUser({
  email,
  password,
  fullName,
  client,
  projectName,
}: SeedUser): Promise<string> {
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
  if (listError) throw listError

  let userId = list.users.find((u) => u.email === email)?.id

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
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
    if (error) throw new Error(`czyszczenie ${table} dla ${email}: ${error.message}`)
  }

  const { data: createdClient, error: clientError } = await admin
    .from('clients')
    .insert({ user_id: userId, ...client })
    .select('id')
    .single()
  if (clientError) throw clientError

  const { error: projectError } = await admin
    .from('projects')
    .insert({ user_id: userId, client_id: createdClient.id, name: projectName, status: 'active' })
  if (projectError) throw projectError

  return userId
}

async function main() {
  const a = await ensureUser({
    email: required('TEST_USER_A_EMAIL'),
    password: required('TEST_USER_A_PASSWORD'),
    fullName: 'E2E Tester',
    client: {
      name: 'E2E Klient Testowy',
      // Stawka godzinowa jest tu istotna: `DayEntryDialog` pokazuje pole
      // "Godziny" tylko dla work_type === 'hourly'.
      work_type: 'hourly',
      rate: 100,
      currency: 'PLN',
      unit: 'h',
    },
    projectName: 'E2E Projekt',
  })

  const b = await ensureUser({
    email: required('TEST_USER_B_EMAIL'),
    password: required('TEST_USER_B_PASSWORD'),
    fullName: 'RLS Tester B',
    client: { name: 'Klient Uzytkownika B' },
    projectName: 'Projekt Uzytkownika B',
  })

  console.log(`[e2e:seed] gotowe — A ${a}, B ${b}`)
}

main().catch((error) => {
  console.error('[e2e:seed]', error)
  process.exit(1)
})
