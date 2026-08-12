import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Project, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki fetcherów z calendar.fetchers.ts
 *
 * Fetchery nie filtrują po `user_id` — scoping robi RLS
 * (`auth.uid() = user_id`, scripts/001_create_tables.sql), dzięki czemu
 * zapytania nie muszą czekać na `getUser()`.
 *
 * Używane WYŁĄCZNIE w Server Components (page.tsx, route handlers, server actions).
 * Import tego pliku w client component = błąd buildu ('server-only').
 */

async function getSupabase() {
  return createClient()
}

export async function fetchCalendarClientsServer(): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')

  if (error) throw new Error(`fetchCalendarClientsServer: ${error.message}`)
  return data ?? []
}

export async function fetchCalendarProjectsServer(): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (error) throw new Error(`fetchCalendarProjectsServer: ${error.message}`)
  return data ?? []
}

export async function fetchCalendarWorkEntriesServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .gte('date', getWorkEntriesWindowStart())

  if (error) throw new Error(`fetchCalendarWorkEntriesServer: ${error.message}`)
  return data ?? []
}
