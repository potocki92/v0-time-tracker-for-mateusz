'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice, InvoiceLineItem, Profile } from '@/lib/types'
import { renderInvoicePdfBlob } from '@/lib/pdf/invoice-pdf'
import {
  extractInvoicePdfPath,
  removeInvoicePdf,
  uploadInvoicePdfWithMeta,
} from '@/services/invoices'
import { resolveInvoiceSettings } from '@/lib/schemas/invoice-settings.schema'

async function currentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Brak autoryzacji użytkownika')
  return { user, supabase }
}

/**
 * Generate a PDF for a given invoice, upload it to Storage and attach the URL
 * to the invoice row. Replaces any previously generated PDF.
 */
export async function generateInvoicePdfAction(invoiceId: string): Promise<{ fileUrl: string }> {
  const { user, supabase } = await currentUser()
  const userId = user.id

  const [{ data: invoice, error: invoiceError }, { data: lineItems, error: itemsError }] =
    await Promise.all([
      supabase.from('invoices').select('*').eq('id', invoiceId).eq('user_id', userId).maybeSingle(),
      supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('position', { ascending: true }),
    ])

  if (invoiceError) throw new Error(invoiceError.message)
  if (!invoice) throw new Error('Nie znaleziono faktury')
  if (itemsError) throw new Error(itemsError.message)

  const items = (lineItems ?? []) as InvoiceLineItem[]
  if (items.length === 0) {
    throw new Error('Nie można wygenerować PDF — faktura nie ma pozycji')
  }

  let client: Client | null = null
  if (invoice.client_id) {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .maybeSingle()
    if (clientError) throw new Error(clientError.message)
    client = (clientData ?? null) as Client | null
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) throw new Error(profileError.message)

  const profile = (profileRow ?? {
    id: userId,
    full_name: user.email ?? '',
    email: user.email ?? null,
  }) as Partial<Profile> & { id: string }

  const settings = resolveInvoiceSettings(user.user_metadata)

  const blob = await renderInvoicePdfBlob({
    invoice: invoice as Invoice,
    lineItems: items,
    client,
    issuer: {
      full_name: profile.full_name ?? user.email ?? '',
      email: profile.email ?? user.email ?? null,
    },
    accentColor: invoice.template_accent_color ?? settings.templateAccentColor,
    footer: invoice.template_footer ?? settings.templateFooter,
    templateKey: (invoice.template_key as 'classic' | 'modern' | 'minimal') ?? settings.defaultTemplate,
  })

  const fileName = `${(invoice.invoice_number ?? invoice.id).replace(/[^a-zA-Z0-9_.-]/g, '_')}.pdf`
  const file = new File([blob], fileName, { type: 'application/pdf' })

  const uploaded = await uploadInvoicePdfWithMeta({ supabase, userId, file })

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ file_url: uploaded.publicUrl })
    .eq('id', invoiceId)

  if (updateError) {
    // Roll back the orphan upload.
    await removeInvoicePdf(supabase, uploaded.filePath, uploaded.bucket)
    throw new Error(updateError.message)
  }

  // Clean up previous PDF after successful swap.
  if (invoice.file_url && invoice.file_url !== uploaded.publicUrl) {
    const oldPath = extractInvoicePdfPath(invoice.file_url)
    if (oldPath) await removeInvoicePdf(supabase, oldPath)
  }

  revalidatePath('/invoices')
  return { fileUrl: uploaded.publicUrl }
}
