'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { InvoiceLineItem } from '@/lib/types'
import {
  invoiceLineItemsSchema,
  type InvoiceLineItemInputSchema,
} from '@/lib/schemas/invoice-line-item.schema'
import { INVOICE_LINE_ITEM_COLUMNS, INVOICES_MAX_LINE_ITEMS } from '../invoices.columns'

async function assertOwnership(invoiceId: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Faktura nie istnieje lub nie należy do zalogowanego użytkownika')
}

async function currentUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Brak autoryzacji użytkownika')
  return user.id
}

/**
 * Replace the full set of line items for a given invoice. Runs delete-then-insert
 * in a single call — trigger recompute_invoice_totals keeps invoice.amount in sync.
 */
export async function replaceInvoiceLineItemsAction(
  invoiceId: string,
  rawItems: unknown,
): Promise<InvoiceLineItem[]> {
  const userId = await currentUserId()
  await assertOwnership(invoiceId, userId)

  const parsed = invoiceLineItemsSchema.safeParse(rawItems)
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join('; ') || 'Nieprawidłowe pozycje faktury',
    )
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId)
  if (deleteError) throw new Error(deleteError.message)

  const rows = parsed.data.map((item: InvoiceLineItemInputSchema, index: number) => ({
    invoice_id: invoiceId,
    user_id: userId,
    position: item.position ?? index + 1,
    description: item.description.trim(),
    unit: item.unit?.trim() || 'szt.',
    quantity: item.quantity,
    unit_price_net: item.unit_price_net,
    vat_rate: item.vat_rate,
  }))

  const { data, error } = await supabase
    .from('invoice_line_items')
    .insert(rows)
    .select(INVOICE_LINE_ITEM_COLUMNS)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)

  return (data ?? []) as InvoiceLineItem[]
}

export async function listInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select(INVOICE_LINE_ITEM_COLUMNS)
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true })
    .limit(INVOICES_MAX_LINE_ITEMS)
  if (error) throw new Error(error.message)
  return (data ?? []) as InvoiceLineItem[]
}
