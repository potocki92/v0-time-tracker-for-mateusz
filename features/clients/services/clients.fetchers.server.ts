import 'server-only'
import { createClient as createSupabase } from '@/lib/supabase/server'
import { requireServerUser } from '@/lib/auth/server-user'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, ClientRate, WorkEntry } from '@/lib/types'
import {
  CLIENTS_CLIENT_COLUMNS,
  CLIENTS_CLIENT_RATE_COLUMNS,
  CLIENTS_MAX_CLIENT_RATES,
  CLIENTS_MAX_CLIENTS,
  CLIENTS_MAX_WORK_ENTRIES,
  CLIENTS_WORK_ENTRY_COLUMNS,
} from './clients.columns'

/**
 * Serwerowe odpowiedniki klienckich fetcherów — używane wyłącznie w Server Components
 * (page.tsx, route handlers). Import w client component = błąd buildu ('server-only').
 *
 * Fetchery nie filtrują po `user_id` — scoping robi RLS (`auth.uid() = user_id`),
 * dzięki czemu zapytania nie muszą czekać na `getUser()`.
 */

async function getSupabase() {
  return createSupabase()
}

export async function fetchClientsServer(): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select(CLIENTS_CLIENT_COLUMNS)
    // `(user_id, created_at desc, id desc)` — dokładnie idx_clients_user_created.
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(CLIENTS_MAX_CLIENTS)

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return (data ?? []) as unknown as Client[]
}

export async function fetchWorkEntriesForClientsServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select(CLIENTS_WORK_ENTRY_COLUMNS)
    .gte('date', getWorkEntriesWindowStart())
    .limit(CLIENTS_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchWorkEntriesForClientsServer: ${error.message}`)
  return (data ?? []) as unknown as WorkEntry[]
}

export async function fetchClientRatesServer(userId: string): Promise<ClientRate[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('client_rates')
    .select(CLIENTS_CLIENT_RATE_COLUMNS)
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })
    .limit(CLIENTS_MAX_CLIENT_RATES)

  if (error) {
    if ((error as { code?: string }).code === '42P01') return []
    throw new Error(`fetchClientRatesServer: ${error.message}`)
  }
  return (data ?? []) as unknown as ClientRate[]
}

export async function fetchCurrentUserIdServer(): Promise<string> {
  return (await requireServerUser()).id
}
