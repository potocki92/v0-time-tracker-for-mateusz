import 'server-only'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { Client, ClientRate, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki klienckich fetcherów — używane wyłącznie w Server Components
 * (page.tsx, route handlers). Import w client component = błąd buildu ('server-only').
 */

async function getSupabase() {
  return createSupabase()
}

export async function fetchClientsServer(userId: string): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntriesForClientsServer(userId: string): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

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
  const supabase = await getSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('User not authenticated')
  return data.user.id
}
