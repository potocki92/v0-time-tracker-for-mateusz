import { createClient } from '@/lib/supabase/client'
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
 * Surowe fetchers modułu kalendarza — tylko transport, zero logiki biznesowej.
 * Analogicznie do dashboard.fetchers.ts.
 */

function getSupabase() {
  return createClient()
}

export async function fetchCalendarClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select(CALENDAR_CLIENT_COLUMNS)
    .eq('user_id', userId)
    .limit(CALENDAR_MAX_CLIENTS)

  if (error) throw new Error(`fetchCalendarClients: ${error.message}`)
  return (data ?? []) as unknown as Client[]
}

export async function fetchCalendarProjects(userId: string): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select(CALENDAR_PROJECT_COLUMNS)
    .eq('user_id', userId)
    .limit(CALENDAR_MAX_PROJECTS)

  if (error) throw new Error(`fetchCalendarProjects: ${error.message}`)
  return (data ?? []) as unknown as Project[]
}

export async function fetchCalendarWorkEntries(userId: string): Promise<WorkEntry[]> {
  const { data, error } = await getSupabase()
    .from('work_entries')
    .select(CALENDAR_WORK_ENTRY_COLUMNS)
    .eq('user_id', userId)
    .gte('date', getWorkEntriesWindowStart())
    .limit(CALENDAR_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchCalendarWorkEntries: ${error.message}`)
  return (data ?? []) as unknown as WorkEntry[]
}

export async function fetchCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

type WorkEntryPayload = Partial<WorkEntry> & {
  user_id: string
  date: string
  status: WorkEntry['status']
}

export async function upsertWorkEntry(
  payload: WorkEntryPayload,
  existingId?: string,
): Promise<WorkEntry> {
  const supabase = getSupabase()
  const query = existingId
    ? supabase.from('work_entries').update(payload).eq('id', existingId).select().single()
    : supabase.from('work_entries').insert(payload).select().single()

  const { data, error } = await query
  if (error) throw new Error(`upsertWorkEntry: ${error.message}`)
  return data as WorkEntry
}

export async function deleteWorkEntry(entryId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('work_entries')
    .delete()
    .eq('id', entryId)

  if (error) throw new Error(`deleteWorkEntry: ${error.message}`)
}
