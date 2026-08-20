import { createClient } from '@/lib/supabase/client'
import { getWorkEntriesWindowStart } from '@/lib/date/work-entries-window'
import type { Client, Invoice, Project, WorkEntry } from '@/lib/types'
import type { WorkEntriesFilter } from '@/lib/query/queryKeys'
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
 * Surowe funkcje fetch — tylko transport, zero logiki biznesowej.
 * Każda funkcja odpowiada za jeden zasób z Supabase.
 */

// ── Supabase helpers ──────────────────────────────────────────────────────────

function getSupabase() {
  return createClient()
}

// ── Resource fetchers ─────────────────────────────────────────────────────────

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select(DASHBOARD_INVOICE_COLUMNS)
    .eq('user_id', userId)
    .order('issue_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(DASHBOARD_MAX_INVOICES)

  if (error) throw new Error(`fetchInvoices: ${error.message}`)
  return (data ?? []) as unknown as Invoice[]
}

export async function fetchWorkEntries(userId: string, filter?: WorkEntriesFilter): Promise<WorkEntry[]> {
  let query = getSupabase()
    .from('work_entries')
    .select(DASHBOARD_WORK_ENTRY_COLUMNS)
    .eq('user_id', userId)

  // Bez jawnego `from` obowiązuje domyślne okno — takie samo jak po stronie
  // serwera, inaczej refetch po hydracji podmieniłby dane na inny zbiór.
  query = query.gte('date', filter?.from ?? getWorkEntriesWindowStart())

  if (filter?.to) {
    query = query.lte('date', filter.to)
  }
  if (filter?.clientId) {
    query = query.eq('client_id', filter.clientId)
  }
  if (filter?.projectId) {
    query = query.eq('project_id', filter.projectId)
  }

  const { data, error } = await query.limit(DASHBOARD_MAX_WORK_ENTRIES)

  if (error) throw new Error(`fetchWorkEntries: ${error.message}`)
  return (data ?? []) as unknown as WorkEntry[]
}


export async function fetchProjects(userId: string): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select(DASHBOARD_PROJECT_COLUMNS)
    .eq('user_id', userId)
    .limit(DASHBOARD_MAX_PROJECTS)

  if (error) throw new Error(`fetchProjects: ${error.message}`)
  return (data ?? []) as unknown as Project[]
}

export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select(DASHBOARD_CLIENT_COLUMNS)
    .eq('user_id', userId)
    .limit(DASHBOARD_MAX_CLIENTS)

  if (error) throw new Error(`fetchClients: ${error.message}`)
  return (data ?? []) as unknown as Client[]
}


// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}
