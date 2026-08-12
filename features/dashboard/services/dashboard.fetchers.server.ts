// app/(app)/dashboard/_services/dashboard.fetchers.server.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Invoice, Project, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki fetcherów z dashboard.fetchers.ts
 *
 * Różnica: używają `@/lib/supabase/server` zamiast browserowego klienta.
 * `server.ts` to async factory bo czyta cookies() z next/headers.
 *
 * Fetchery NIE przyjmują `userId` i nie filtrują po `user_id` — scoping robi
 * RLS (`auth.uid() = user_id`, scripts/001_create_tables.sql). Dzięki temu
 * zapytania startują równolegle z `getServerUser()` zamiast czekać na nie.
 *
 * Używane WYŁĄCZNIE w Server Components (page.tsx, route handlers, server actions).
 * Import tego pliku w client component = błąd buildu ('server-only').
 */

async function getSupabase() {
  return createClient()
}

export async function fetchInvoicesServer(): Promise<Invoice[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')

  if (error) throw new Error(`fetchInvoicesServer: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntriesServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .gte('date', getWorkEntriesWindowStart())

  if (error) throw new Error(`fetchWorkEntriesServer: ${error.message}`)
  return data ?? []
}

export async function fetchClientsServer(): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return data ?? []
}


export async function fetchProjectsServer(): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (error) throw new Error(`fetchProjectsServer: ${error.message}`)
  return data ?? []
}
