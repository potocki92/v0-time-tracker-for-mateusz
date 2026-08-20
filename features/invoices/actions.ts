'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireServerUser } from '@/lib/auth/server-user'
import { createClient } from '@/lib/supabase/server'
import type { ImportInvoiceCsvRow } from './domain'

/**
 * Import faktur z pliku ksiegowego.
 *
 * Parsowanie CSV zostaje w przegladarce (czysty string -> tablica), do serwera
 * jedzie juz gotowa lista wierszy. Kazdy wiersz przechodzi przez Zoda, zanim
 * dotknie bazy — to endpoint POST, a nie zaufane wywolanie z wnetrza aplikacji.
 * Supabase jedzie na anon key + ciasteczkach, wiec RLS nadal obowiazuje.
 */

const csvRowSchema = z.object({
  name:           z.string().trim().max(200),
  invoice_number: z.string().trim().max(60),
  recipient:      z.string().trim().max(200),
  client_name:    z.string().trim().max(120),
  billing_period: z.string().trim().max(120),
  invoice_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowa data faktury'),
  amount:         z.number().finite('Nieprawidłowa kwota'),
  currency:       z.enum(['PLN', 'EUR']),
  is_paid:        z.boolean(),
  notes:          z.string().trim().max(2000),
})

/** Sufit jednego importu — plik ksiegowy nie ma prawa byc wiekszy. */
const MAX_IMPORT_ROWS = 1_000

const csvRowsSchema = z
  .array(csvRowSchema)
  .max(MAX_IMPORT_ROWS, `Maksymalnie ${MAX_IMPORT_ROWS} faktur w jednym imporcie`)

async function findOrCreateClientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string,
): Promise<string | null> {
  const trimmedName = name.trim()
  if (!trimmedName) return null

  const existing = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', trimmedName)
    .maybeSingle()

  if (existing.error) throw new Error(existing.error.message)
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

export async function importInvoicesFromCsvAction(
  rows: ImportInvoiceCsvRow[],
): Promise<void> {
  if (rows.length === 0) return

  const parsed = csvRowsSchema.safeParse(rows)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const rowNumber = typeof issue?.path[0] === 'number' ? issue.path[0] + 1 : null
    throw new Error(
      rowNumber
        ? `Wiersz ${rowNumber}: ${issue?.message ?? 'nieprawidłowe dane'}`
        : (issue?.message ?? 'Nieprawidłowy plik importu'),
    )
  }

  const user = await requireServerUser()
  const supabase = await createClient()

  const clientIdCache = new Map<string, string | null>()
  const payload = []

  for (const row of parsed.data) {
    const normalizedClientName = row.client_name.toLocaleLowerCase('pl-PL')
    let resolvedClientId: string | null = null

    if (normalizedClientName) {
      if (clientIdCache.has(normalizedClientName)) {
        resolvedClientId = clientIdCache.get(normalizedClientName) ?? null
      } else {
        resolvedClientId = await findOrCreateClientId(supabase, user.id, row.client_name)
        clientIdCache.set(normalizedClientName, resolvedClientId)
      }
    }

    payload.push({
      user_id: user.id,
      client_id: resolvedClientId,
      name: row.name,
      invoice_number: row.invoice_number || null,
      recipient: row.recipient || null,
      billing_period: row.billing_period || null,
      issue_date: row.invoice_date,
      amount: row.amount,
      currency: row.currency,
      is_paid: row.is_paid,
      notes: row.notes || null,
    })
  }

  const { error } = await supabase.from('invoices').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
