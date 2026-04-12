import { createClient } from '@/lib/supabase/client'
import { fetchCurrentEurRate } from '@/lib/api/eurRate'
import type { Client, Invoice, WorkEntry } from '@/lib/types'

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

export async function fetchWorkEntries(userId: string): Promise<WorkEntry[]> {
  const { data, error } = await getSupabase()
    .from('work_entries')
    .select('*')
    .eq('user_id', userId)

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

// ── Mutacje ───────────────────────────────────────────────────────────────────

export async function updateInvoicePaid(invoiceId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('invoices')
    .update({ is_paid: true })
    .eq('id', invoiceId)

  if (error) throw new Error(`updateInvoicePaid: ${error.message}`)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser()
  if (error || !user) throw new Error('User not authenticated')
  return user
}