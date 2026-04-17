import { createClient } from '@/lib/supabase/client'
import { uploadInvoicePdf } from '@/services/invoices'
import type { Client, Invoice } from '@/lib/types'
import type { InvoiceFormValues } from '../_domain'

function getSupabase() {
  return createClient()
}

async function fetchCurrentUserId() {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser()

  if (error || !user) {
    throw new Error('Brak autoryzacji użytkownika')
  }

  return user.id
}

export async function fetchInvoicesAndClients(): Promise<{ invoices: Invoice[]; clients: Client[] }> {
  const userId = await fetchCurrentUserId()

  const [invoicesRes, clientsRes] = await Promise.all([
    getSupabase().from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    getSupabase().from('clients').select('*').eq('user_id', userId).order('name', { ascending: true }),
  ])

  if (invoicesRes.error) throw new Error(invoicesRes.error.message)
  if (clientsRes.error) throw new Error(clientsRes.error.message)

  return {
    invoices: (invoicesRes.data ?? []) as Invoice[],
    clients: (clientsRes.data ?? []) as Client[],
  }
}

export async function createClientIfNeeded(name: string): Promise<string | null> {
  const trimmedName = name.trim()
  if (!trimmedName) return null

  const userId = await fetchCurrentUserId()
  const supabase = getSupabase()

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
  const userId = await fetchCurrentUserId()
  const supabase = getSupabase()

  const resolvedClientId = values.client_id ?? (await createClientIfNeeded(values.new_client_name))

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
  const { error } = await getSupabase().from('invoices').delete().eq('id', invoiceId)
  if (error) throw new Error(error.message)
}
