import { createClient } from '@/lib/supabase/client'
import { uploadInvoicePdf } from '@/services/invoices'
import type { Client, Invoice } from '@/lib/types'
import type { ImportInvoiceCsvRow, InvoiceFormValues } from '../_domain'

async function fetchCurrentUserId(supabase = createClient()) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Brak autoryzacji użytkownika')
  }

  return user.id
}

export async function fetchInvoicesAndClients(): Promise<{ invoices: Invoice[]; clients: Client[] }> {
  const supabase = createClient()
  const userId = await fetchCurrentUserId(supabase)

  const [invoicesRes, clientsRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('clients').select('*').eq('user_id', userId).order('name', { ascending: true }),
  ])

  if (invoicesRes.error) throw new Error(invoicesRes.error.message)
  if (clientsRes.error) throw new Error(clientsRes.error.message)

  return {
    invoices: (invoicesRes.data ?? []) as Invoice[],
    clients: (clientsRes.data ?? []) as Client[],
  }
}

export async function createClientIfNeeded(
  name: string,
  options?: { userId?: string; supabase?: ReturnType<typeof createClient> },
): Promise<string | null> {
  const trimmedName = name.trim()
  if (!trimmedName) return null

  const supabase = options?.supabase ?? createClient()
  const userId = options?.userId ?? (await fetchCurrentUserId(supabase))

  const existing = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing.error) {
    throw new Error(existing.error.message)
  }

  if (existing.data?.id) return existing.data.id

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: trimmedName,
      work_type: 'hourly',
      rate: 0,
      currency: 'PLN',
      is_default: false,
      color: '#3b82f6',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function saveInvoice({ invoiceId, values }: { invoiceId?: string; values: InvoiceFormValues }) {
  const supabase = createClient()
  const userId = await fetchCurrentUserId(supabase)

  const resolvedClientId =
    values.client_id ??
    (await createClientIfNeeded(values.new_client_name, {
      userId,
      supabase,
    }))

  const pdfUrl = values.file
    ? await uploadInvoicePdf({
        supabase,
        userId,
        file: values.file,
      })
    : null

  const payload = {
    user_id: userId,
    client_id: resolvedClientId,
    name: values.name.trim(),
    invoice_number: values.invoice_number.trim() || null,
    recipient: values.recipient.trim() || null,
    billing_period: values.billing_period.trim() || null,
    issue_date: values.invoice_date,
    amount: values.amount,
    currency: values.currency,
    is_paid: values.is_paid,
    file_url: pdfUrl,
    notes: values.notes.trim() || null,
  }

  if (invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({ ...payload, file_url: pdfUrl ?? undefined })
      .eq('id', invoiceId)

    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase.from('invoices').insert(payload)
  if (error) throw new Error(error.message)
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw new Error(error.message)
}

export async function importInvoicesFromCsv(rows: ImportInvoiceCsvRow[]) {
  if (rows.length === 0) return

  const supabase = createClient()
  const userId = await fetchCurrentUserId(supabase)

  const payload = []

  for (const row of rows) {
    const resolvedClientId = row.client_name
      ? await createClientIfNeeded(row.client_name, {
          userId,
          supabase,
        })
      : null

    payload.push({
      user_id: userId,
      client_id: resolvedClientId,
      name: row.name.trim(),
      invoice_number: row.invoice_number.trim() || null,
      recipient: row.recipient.trim() || null,
      billing_period: row.billing_period.trim() || null,
      issue_date: row.invoice_date,
      amount: row.amount,
      currency: row.currency,
      is_paid: row.is_paid,
      notes: row.notes.trim() || null,
    })
  }

  const { error } = await supabase.from('invoices').insert(payload)
  if (error) throw new Error(error.message)
}
