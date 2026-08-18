// app/(app)/dashboard/_services/dashboard.fetchers.server.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Invoice, Project, WorkEntry } from '@/lib/types'
import {
  DASHBOARD_CLIENT_COLUMNS,
  DASHBOARD_INVOICE_COLUMNS,
  DASHBOARD_MAX_CLIENTS,
  DASHBOARD_MAX_INVOICES,
  DASHBOARD_MAX_PROJECTS,
  DASHBOARD_MAX_WORK_ENTRIES,
  DASHBOARD_PROJECT_COLUMNS,
  DASHBOARD_WORK_ENTRY_COLUMNS,
} from './dashboard.columns'

/**
 * Serwerowe odpowiedniki fetcherów z dashboard.fetchers.ts
 *
 * Różnica: używają `@/lib/supabase/server` zamiast browserowego klienta.
 * `server.ts` to async factory bo czyta cookies() z next/headers.
 *
 * Fetchery NIE przyjmują `userId` i nie filtrują po `user_id` — scoping robi
 * RLS (`auth.uid() = user_id`, migracja `create_tables`). Dzięki temu
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
    .select(DASHBOARD_INVOICE_COLUMNS)
    .order('issue_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(DASHBOARD_MAX_INVOICES)

  if (error) throw new Error(`fetchInvoicesServer: ${error.message}`)
  return (data ?? []) as unknown as Invoice[]
}

export async function fetchWorkEntriesServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select(DASHBOARD_WORK_ENTRY_COLUMNS)
    .gte('date', getWorkEntriesWindowStart())
    .limit(DASHBOARD_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchWorkEntriesServer: ${error.message}`)
  return (data ?? []) as unknown as WorkEntry[]
}

export async function fetchClientsServer(): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select(DASHBOARD_CLIENT_COLUMNS)
    .limit(DASHBOARD_MAX_CLIENTS)

  if (error) throw new Error(`fetchClientsServer: ${error.message}`)
  return (data ?? []) as unknown as Client[]
}


export async function fetchProjectsServer(): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select(DASHBOARD_PROJECT_COLUMNS)
    .limit(DASHBOARD_MAX_PROJECTS)

  if (error) throw new Error(`fetchProjectsServer: ${error.message}`)
  return (data ?? []) as unknown as Project[]
}
