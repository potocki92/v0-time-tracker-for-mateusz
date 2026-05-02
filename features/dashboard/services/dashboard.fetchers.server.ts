// app/(app)/dashboard/_services/dashboard.fetchers.server.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import type { Client, Invoice, Project, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki fetcherów z dashboard.fetchers.ts
 *
 * Różnica: używają `@/lib/supabase/server` zamiast browserowego klienta.
 * `server.ts` to async factory bo czyta cookies() z next/headers.
 *
 * Używane WYŁĄCZNIE w Server Components (page.tsx, route handlers, server actions).
 * Import tego pliku w client component = błąd buildu ('server-only').
 */

async function getSupabase() {
  return createClient()
}

export async function fetchInvoicesServer(userId: string): Promise<Invoice[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchInvoicesServer: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntriesServer(userId: string): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchWorkEntriesServer: ${error.message}`)
  return data ?? []
}

export async function fetchClientsServer(userId: string): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return data ?? []
}


export async function fetchProjectsServer(userId: string): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchProjectsServer: ${error.message}`)
  return data ?? []
}

export async function fetchEurRateServer(): Promise<number | null> {
  // eurRate i tak leci przez fetch() do NBP, nie przez Supabase —
  // ta sama implementacja działa na serwerze i kliencie.
  return fetchCurrentEurRate()
}

export async function fetchCurrentUserServer() {
  const supabase = await getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}
