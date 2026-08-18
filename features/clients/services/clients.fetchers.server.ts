import 'server-only'
import { createClient as createSupabase } from '@/lib/supabase/server'
import { requireServerUser } from '@/lib/auth/server-user'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, ClientRate, WorkEntry } from '@/lib/types'

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
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntriesForClientsServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .gte('date', getWorkEntriesWindowStart())

  if (error) throw new Error(`fetchWorkEntriesForClientsServer: ${error.message}`)
  return data ?? []
}

export async function fetchClientRatesServer(userId: string): Promise<ClientRate[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('client_rates')
    .select('*')
    .eq('user_id', userId)
    .order('effective_from', { ascending: false })

  if (error) {
    if ((error as { code?: string }).code === '42P01') return []
    throw new Error(`fetchClientRatesServer: ${error.message}`)
  }
  return data ?? []
}

export async function fetchCurrentUserIdServer(): Promise<string> {
  return (await requireServerUser()).id
}
