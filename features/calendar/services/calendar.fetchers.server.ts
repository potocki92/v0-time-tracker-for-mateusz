import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Project, WorkEntry } from '@/lib/types'
import {
  CALENDAR_CLIENT_COLUMNS,
  CALENDAR_MAX_CLIENTS,
  CALENDAR_MAX_PROJECTS,
  CALENDAR_MAX_WORK_ENTRIES,
  CALENDAR_PROJECT_COLUMNS,
  CALENDAR_WORK_ENTRY_COLUMNS,
} from './calendar.columns'

/**
 * Serwerowe odpowiedniki fetcherów z calendar.fetchers.ts
 *
 * Fetchery nie filtrują po `user_id` — scoping robi RLS
 * (`auth.uid() = user_id`, migracja `create_tables`), dzięki czemu
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
    .select(CALENDAR_CLIENT_COLUMNS)
    .limit(CALENDAR_MAX_CLIENTS)

  if (error) throw new Error(`fetchCalendarClientsServer: ${error.message}`)
  return (data ?? []) as unknown as Client[]
}

export async function fetchCalendarProjectsServer(): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select(CALENDAR_PROJECT_COLUMNS)
    .limit(CALENDAR_MAX_PROJECTS)

  if (error) throw new Error(`fetchCalendarProjectsServer: ${error.message}`)
  return (data ?? []) as unknown as Project[]
}

export async function fetchCalendarWorkEntriesServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select(CALENDAR_WORK_ENTRY_COLUMNS)
    .gte('date', getWorkEntriesWindowStart())
    .limit(CALENDAR_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchCalendarWorkEntriesServer: ${error.message}`)
  return (data ?? []) as unknown as WorkEntry[]
}
