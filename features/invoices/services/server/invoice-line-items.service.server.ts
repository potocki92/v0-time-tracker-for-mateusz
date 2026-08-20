'use server'

import { createClient } from '@/lib/supabase/server'
import type { InvoiceLineItem } from '@/lib/types'
import { INVOICE_LINE_ITEM_COLUMNS, INVOICES_MAX_LINE_ITEMS } from '../invoices.columns'

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
