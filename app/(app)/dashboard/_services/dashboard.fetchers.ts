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

const INVOICE_COLUMNS = [
  'id', 'user_id', 'client_id', 'name', 'issue_date', 'invoice_date', 'due_date',
  'invoice_number', 'recipient', 'description', 'billing_period', 'amount',
  'net_amount', 'vat_amount', 'gross_amount', 'currency', 'is_paid', 'paid_date',
  'status', 'file_url', 'notes', 'template_key', 'template_accent_color',
  'template_footer', 'auto_generated', 'period_start', 'period_end', 'note',
  'month', 'year', 'created_at',
].join(', ')

const WORK_ENTRY_COLUMNS = [
  'id', 'user_id', 'client_id', 'project_id', 'date', 'status', 'hours', 'quantity',
  'quantity_from', 'quantity_to', 'category', 'tags', 'notes', 'billing_rate',
  'billing_currency', 'billing_work_type', 'billing_unit', 'created_at',
].join(', ')

const CLIENT_COLUMNS = [
  'id', 'user_id', 'name', 'nip', 'regon', 'address', 'city', 'postal_code',
  'region', 'country_code', 'phone', 'email', 'website', 'locale', 'timezone',
  'work_type', 'rate', 'currency', 'unit', 'is_default', 'auto_invoice_enabled',
  'auto_invoice_frequency', 'color', 'created_at',
].join(', ')

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select(INVOICE_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchInvoices: ${error.message}`)
  return data ?? []
}

export async function fetchWorkEntries(userId: string, filter?: WorkEntriesFilter): Promise<WorkEntry[]> {
  let query = getSupabase()
    .from('work_entries')
    .select(WORK_ENTRY_COLUMNS)
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
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`fetchWorkEntries: ${error.message}`)
  return data ?? []
}

export async function fetchClients(userId: string): Promise<Client[]> {
  const { data, error } = await getSupabase()
    .from('clients')
    .select(CLIENT_COLUMNS)
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw new Error(`fetchClients: ${error.message}`)
  return data ?? []
}

export async function fetchEurRate(): Promise<number | null> {
  return fetchCurrentEurRate()
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
