import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Project, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki fetcherów. Używają cookie-bound `@/lib/supabase/server`
 * i są przeznaczone wyłącznie do Server Components / route handlers / server actions.
 *
 * Fetchery nie filtrują po `user_id` — scoping robi RLS (`auth.uid() = user_id`),
 * dzięki czemu zapytania nie muszą czekać na `getUser()`.
 */

async function getSupabase() {
  return createClient()
}

export async function fetchProjectsServer(): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchProjectsServer: ${error.message}`)
  return (data ?? []) as Project[]
}

export async function fetchProjectsClientsServer(): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  if (error) throw new Error(`fetchProjectsClientsServer: ${error.message}`)
  return (data ?? []) as Client[]
}

export async function fetchProjectsWorkEntriesServer(): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .gte('date', getWorkEntriesWindowStart())

  if (error) throw new Error(`fetchProjectsWorkEntriesServer: ${error.message}`)
  return (data ?? []) as WorkEntry[]
}
