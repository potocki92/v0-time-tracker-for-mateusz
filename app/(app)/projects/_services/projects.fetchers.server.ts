import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Client, Project, WorkEntry } from '@/lib/types'

/**
 * Serwerowe odpowiedniki fetcherów z projects.fetchers.ts.
 * Używają `@/lib/supabase/server` bo czyta cookies() z next/headers.
 * Wyłącznie w Server Components / route handlers / server actions.
 */

async function getSupabase() {
  return createClient()
}

export async function fetchProjectsServer(userId: string): Promise<Project[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchProjectsServer: ${error.message}`)
  return (data ?? []) as Project[]
}

export async function fetchProjectsClientsServer(userId: string): Promise<Client[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  if (error) throw new Error(`fetchProjectsClientsServer: ${error.message}`)
  return (data ?? []) as Client[]
}

export async function fetchProjectsWorkEntriesServer(userId: string): Promise<WorkEntry[]> {
  const supabase = await getSupabase()
  const { data, error } = await supabase
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchProjectsWorkEntriesServer: ${error.message}`)
  return (data ?? []) as WorkEntry[]
}

export async function fetchCurrentUserServer() {
  const supabase = await getSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}
