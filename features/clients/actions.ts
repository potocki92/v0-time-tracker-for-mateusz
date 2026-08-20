'use server'

import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { Client, ClientFormData, ClientRate, ClientRateFormData } from '@/lib/types'
import { CLIENT_COLORS } from './domain/clients.constants'
import {
  CLIENTS_CLIENT_COLUMNS,
  CLIENTS_CLIENT_RATE_COLUMNS,
  CLIENTS_MAX_CLIENT_RATES,
} from './services/clients.columns'

/**
 * Server Actions modulu Clients.
 *
 * Kazda akcja to endpoint POST, wiec wejscie z przegladarki przechodzi przez
 * Zoda zanim dotknie bazy. `user_id` bierzemy z sesji po stronie serwera —
 * nigdy z requestu. Supabase jedzie na anon key + ciasteczkach, wiec RLS nadal
 * obowiazuje; klucz service-role nie ma tu wstepu.
 */

const CURRENCY = z.enum(['PLN', 'EUR'])
const WORK_TYPE = z.enum(['hourly', 'piecework'])

/** Kontrakt zapisu klienta — plaski wiersz, nie ksztalt formularza. */
const clientPayloadSchema = z.object({
  name:                   z.string().trim().min(1, 'Podaj nazwę klienta').max(120, 'Maks. 120 znaków'),
  nip:                    z.string().trim().max(32).optional(),
  regon:                  z.string().trim().max(32).optional(),
  address:                z.string().trim().max(200).optional(),
  city:                   z.string().trim().max(100).optional(),
  postal_code:            z.string().trim().max(20).optional(),
  region:                 z.string().trim().max(100).optional(),
  country_code:           z.string().trim().max(2).optional(),
  phone:                  z.string().trim().max(32).optional(),
  email:                  z.string().trim().email('Podaj poprawny adres email').or(z.literal('')).optional(),
  website:                z.string().trim().url('Podaj pełny adres URL').or(z.literal('')).optional(),
  locale:                 z.string().trim().max(10).optional(),
  timezone:               z.string().trim().max(64).optional(),
  work_type:              WORK_TYPE,
  rate:                   z.number().positive('Stawka musi być większa niż 0'),
  currency:               CURRENCY,
  unit:                   z.string().trim().max(20).optional(),
  is_default:             z.boolean(),
  auto_invoice_enabled:   z.boolean().optional(),
  auto_invoice_frequency: z.enum(['weekly', 'monthly']).optional(),
  color: z
    .string()
    .refine((color) => (CLIENT_COLORS as readonly string[]).includes(color), 'Wybierz kolor z listy'),
})

const clientRatePayloadSchema = z.object({
  rate:           z.number().positive('Stawka musi być większa niż 0'),
  currency:       CURRENCY,
  work_type:      WORK_TYPE,
  unit:           z.string().trim().max(20).optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data'),
  note:           z.string().trim().max(500).optional(),
})

const uuidSchema = z.string().uuid('Nieprawidłowy identyfikator')

type ClientPayload = z.infer<typeof clientPayloadSchema>

function firstIssue(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback
}

function toClientRow(userId: string, input: ClientPayload) {
  return {
    user_id:      userId,
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

/**
 * Historia stawek. Graceful fallback — jeśli tabela `client_rates` jeszcze nie istnieje
 * (migracja 005 nie została puszczona), zwracamy pustą tablicę zamiast wywracać cały widok.
 */
export async function fetchClientRatesAction(clientId?: string): Promise<ClientRate[]> {
  if (clientId !== undefined) {
    const parsedId = uuidSchema.safeParse(clientId)
    if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy klient'))
  }

  const supabase = await createSupabase()

  let query = supabase
    .from('client_rates')
    .select(CLIENTS_CLIENT_RATE_COLUMNS)
    .order('effective_from', { ascending: false })
    .limit(CLIENTS_MAX_CLIENT_RATES)

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) {
    // 42P01 = undefined_table (Postgres). Inne błędy propagujemy.
    if ((error as { code?: string }).code === '42P01') return []
    throw new Error(`fetchClientRates: ${error.message}`)
  }
  return (data ?? []) as unknown as ClientRate[]
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

async function clearDefault(
  supabase: Awaited<ReturnType<typeof createSupabase>>,
  userId: string,
  exceptId?: string,
): Promise<void> {
  let q = supabase.from('clients').update({ is_default: false }).eq('user_id', userId)
  if (exceptId) q = q.neq('id', exceptId)
  const { error } = await q
  if (error) throw new Error(`clearDefault: ${error.message}`)
}

export async function createClientAction(input: ClientFormData): Promise<Client> {
  const parsed = clientPayloadSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane klienta'))

  const user = await requireServerUser()
  const supabase = await createSupabase()

  if (parsed.data.is_default) await clearDefault(supabase, user.id)

  const { data, error } = await supabase
    .from('clients')
    .insert(toClientRow(user.id, parsed.data))
    .select(CLIENTS_CLIENT_COLUMNS)
    .single()

  if (error) throw new Error(`createClient: ${error.message}`)

  return data as unknown as Client
}

export async function updateClientAction(id: string, input: ClientFormData): Promise<Client> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy klient'))

  const parsed = clientPayloadSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane klienta'))

  const user = await requireServerUser()
  const supabase = await createSupabase()

  if (parsed.data.is_default) await clearDefault(supabase, user.id, parsedId.data)

  const { data, error } = await supabase
    .from('clients')
    .update(toClientRow(user.id, parsed.data))
    .eq('id', parsedId.data)
    .select(CLIENTS_CLIENT_COLUMNS)
    .single()

  if (error) throw new Error(`updateClient: ${error.message}`)

  return data as unknown as Client
}

export async function deleteClientAction(id: string): Promise<void> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy klient'))

  const supabase = await createSupabase()
  const { error } = await supabase.from('clients').delete().eq('id', parsedId.data)

  if (error) throw new Error(`deleteClient: ${error.message}`)

}

/**
 * Dodanie nowej stawki obowiązującej od daty. Aktualizujemy też `clients.rate`
 * (denormalizacja dla szybkiego odczytu), jeśli nowa stawka jest najbardziej aktualna.
 */
export async function addClientRateAction(
  clientId: string,
  input: ClientRateFormData,
  makeCurrent: boolean,
): Promise<ClientRate> {
  const parsedId = uuidSchema.safeParse(clientId)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy klient'))

  const parsed = clientRatePayloadSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstIssue(parsed.error, 'Nieprawidłowe dane stawki'))

  const user = await requireServerUser()
  const supabase = await createSupabase()
  const values = parsed.data

  const { data, error } = await supabase
    .from('client_rates')
    .insert({
      user_id:        user.id,
      client_id:      parsedId.data,
      rate:           values.rate,
      currency:       values.currency,
      work_type:      values.work_type,
      unit:           values.work_type === 'piecework' ? (values.unit ?? null) : null,
      effective_from: values.effective_from,
      note:           values.note ?? null,
    })
    .select(CLIENTS_CLIENT_RATE_COLUMNS)
    .single()

  if (error) throw new Error(`addClientRate: ${error.message}`)

  if (makeCurrent) {
    const { error: updErr } = await supabase
      .from('clients')
      .update({
        rate:      values.rate,
        currency:  values.currency,
        work_type: values.work_type,
        unit:      values.work_type === 'piecework' ? (values.unit ?? null) : null,
      })
      .eq('id', parsedId.data)
    if (updErr) throw new Error(`addClientRate/updateClient: ${updErr.message}`)
  }

  return data as unknown as ClientRate
}

export async function deleteClientRateAction(id: string): Promise<void> {
  const parsedId = uuidSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstIssue(parsedId.error, 'Nieprawidłowy wpis'))

  const supabase = await createSupabase()
  const { error } = await supabase.from('client_rates').delete().eq('id', parsedId.data)

  if (error) throw new Error(`deleteClientRate: ${error.message}`)

}
