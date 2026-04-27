import { createClient } from '@/lib/supabase/client'
import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import type { Client, Invoice, WorkEntry } from '@/lib/types'
import type { WorkEntriesFilter } from '@/lib/query/queryKeys'

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
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchInvoices: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntries(userId: string, filter?: WorkEntriesFilter): Promise<WorkEntry[]> {
  let query = getSupabase()
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

  if (filter?.from) {
    query = query.gte('date', filter.from)
  }
  if (filter?.to) {
    query = query.lte('date', filter.to)
  }
  if (filter?.clientId) {
    query = query.eq('client_id', filter.clientId)
  }
  if (filter?.projectId) {
    query = query.eq('project_id', filter.projectId)
  }

  const { data, error } = await query

  if (error) throw new Error(`fetchWorkEntries: ${error.message}`)
  return data ?? []
}

export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error(`fetchClients: ${error.message}`)
  return data ?? []
}

export async function fetchEurRate(): Promise<number | null> {
  return fetchCurrentEurRate()
}



export async function fetchWorkEntriesPage(userId: string, page: number, pageSize = 50) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await getSupabase()
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(from, to)

  if (error) throw new Error(`fetchWorkEntriesPage: ${error.message}`)
  const items = data ?? []

  return {
    items,
    nextPage: items.length === pageSize ? page + 1 : undefined,
  }
}

// ── Mutacje ───────────────────────────────────────────────────────────────────

export async function updateInvoicePaid(invoiceId: string): Promise<void> {
  const user = await fetchCurrentUser()
  const paidDate = new Date().toISOString().slice(0, 10)
  const { error } = await getSupabase()
    .from('invoices')
    .update({ is_paid: true, status: 'PAID', paid_date: paidDate })
    .eq('id', invoiceId)
    .eq('user_id', user.id)

  if (error) throw new Error(`updateInvoicePaid: ${error.message}`)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}
