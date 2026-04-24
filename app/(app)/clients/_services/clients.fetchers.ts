import { createClient as createSupabase } from '@/lib/supabase/client'
import type {
  Client,
  ClientFormData,
  ClientRate,
  ClientRateFormData,
  WorkEntry,
} from '@/lib/types'

/**
 * Surowe funkcje fetch/mutacji dla modułu Clients — tylko transport, bez logiki biznesowej.
 */

function getSupabase() {
  return createSupabase()
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchClients: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntriesForClients(userId: string): Promise<WorkEntry[]> {
  const { data, error } = await getSupabase()
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchWorkEntriesForClients: ${error.message}`)
  return data ?? []
}

/**
 * Historia stawek. Graceful fallback — jeśli tabela `client_rates` jeszcze nie istnieje
 * (migracja 005 nie została puszczona), zwracamy pustą tablicę zamiast wywracać cały widok.
 */
export async function fetchClientRates(
  userId: string,
  clientId?: string,
): Promise<ClientRate[]> {
  let query = getSupabase()
    .from('client_rates')
    .select('*')
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) {
    // 42P01 = undefined_table (Postgres). Inne błędy propagujemy.
    if ((error as { code?: string }).code === '42P01') return []
    throw new Error(`fetchClientRates: ${error.message}`)
  }
  return data ?? []
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

export type ClientMutationInput = Omit<ClientFormData, 'rate'> & {
  rate: number
  user_id: string
}

// NOTE: `region`, `country_code`, `locale`, `timezone` require a DB migration
// adding those columns to `public.clients`. Until then, those keys will be
// silently rejected by Supabase (or included when the migration lands).
function toClientRow(input: ClientMutationInput) {
  return {
    user_id:      input.user_id,
    name:         input.name,
    nip:          input.nip || null,
    regon:        input.regon || null,
    address:      input.address || null,
    city:         input.city || null,
    postal_code:  input.postal_code || null,
    region:       input.region || null,
    country_code: input.country_code || null,
    phone:        input.phone || null,
    email:        input.email || null,
    website:      input.website || null,
    locale:       input.locale || null,
    timezone:     input.timezone || null,
    work_type:    input.work_type,
    rate:         input.rate,
    currency:     input.currency,
    unit:         input.work_type === 'piecework' ? (input.unit ?? null) : null,
    is_default:   input.is_default,
    auto_invoice_enabled: Boolean(input.auto_invoice_enabled),
    auto_invoice_frequency: input.auto_invoice_frequency ?? 'weekly',
    color:        input.color,
  }
}

async function clearDefault(userId: string, exceptId?: string): Promise<void> {
  let q = getSupabase()
    .from('clients')
    .update({ is_default: false })
    .eq('user_id', userId)
  if (exceptId) q = q.neq('id', exceptId)
  const { error } = await q
  if (error) throw new Error(`clearDefault: ${error.message}`)
}

export async function createClient(input: ClientMutationInput): Promise<Client> {
  if (input.is_default) await clearDefault(input.user_id)

  const { data, error } = await getSupabase()
    .from('clients')
    .insert(toClientRow(input))
    .select('*')
    .single()

  if (error) throw new Error(`createClient: ${error.message}`)
  return data as Client
}

export async function updateClient(
  id: string,
  input: ClientMutationInput,
): Promise<Client> {
  if (input.is_default) await clearDefault(input.user_id, id)

  const { data, error } = await getSupabase()
    .from('clients')
    .update(toClientRow(input))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`updateClient: ${error.message}`)
  return data as Client
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteClient: ${error.message}`)
}

/**
 * Dodanie nowej stawki obowiązującej od daty. Aktualizujemy też `clients.rate`
 * (denormalizacja dla szybkiego odczytu), jeśli nowa stawka jest najbardziej aktualna.
 */
export async function addClientRate(
  userId: string,
  clientId: string,
  input: ClientRateFormData,
  makeCurrent: boolean,
): Promise<ClientRate> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('client_rates')
    .insert({
      user_id:        userId,
      client_id:      clientId,
      rate:           input.rate,
      currency:       input.currency,
      work_type:      input.work_type,
      unit:           input.work_type === 'piecework' ? (input.unit ?? null) : null,
      effective_from: input.effective_from,
      note:           input.note ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`addClientRate: ${error.message}`)

  if (makeCurrent) {
    const { error: updErr } = await supabase
      .from('clients')
      .update({
        rate:      input.rate,
        currency:  input.currency,
        work_type: input.work_type,
        unit:      input.work_type === 'piecework' ? (input.unit ?? null) : null,
      })
      .eq('id', clientId)
    if (updErr) throw new Error(`addClientRate/updateClient: ${updErr.message}`)
  }

  return data as ClientRate
}

export async function deleteClientRate(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('client_rates')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteClientRate: ${error.message}`)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) throw new Error('User not authenticated')
  return data.user.id
}
