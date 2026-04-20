'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { cache } from 'react'
import { uploadInvoicePdf } from '@/services/invoices'
import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice } from '@/lib/types'
import type { InvoicesData, SaveInvoiceInput } from '../_domain'

async function fetchCurrentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Brak autoryzacji użytkownika')
  }

  return user.id
}

async function createClientIfNeeded(name: string, userId: string): Promise<string | null> {
  const trimmedName = name.trim()
  if (!trimmedName) return null

  const supabase = await createClient()

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

const getInvoicesDataServerCached = cache(async (): Promise<InvoicesData> => {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { invoices: [], clients: [] }
  }

  const [invoicesRes, clientsRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name', { ascending: true }),
  ])

  if (invoicesRes.error) throw new Error(invoicesRes.error.message)
  if (clientsRes.error) throw new Error(clientsRes.error.message)

  return {
    invoices: (invoicesRes.data ?? []) as Invoice[],
    clients: (clientsRes.data ?? []) as Client[],
  }
})

export async function getInvoicesDataServer(): Promise<InvoicesData> {
  return getInvoicesDataServerCached()
}

export async function saveInvoiceAction({ invoiceId, values }: SaveInvoiceInput) {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()

  const resolvedClientId = values.client_id ?? (await createClientIfNeeded(values.new_client_name, userId))

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
    recipient: (values.recipient || values.new_client_name || '').trim() || null,
    billing_period: values.billing_period.trim() || `${values.billing_quarter} ${values.billing_year}`,
    issue_date: values.invoice_date,
    invoice_date: values.invoice_date,
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
  } else {
    const { error } = await supabase.from('invoices').insert(payload)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function deleteInvoiceAction(invoiceId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
