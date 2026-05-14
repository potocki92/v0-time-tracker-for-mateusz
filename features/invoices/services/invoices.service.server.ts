'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { cache } from 'react'
import {
  extractInvoicePdfPath,
  removeInvoicePdf,
  uploadInvoicePdfWithMeta,
} from '@/services/invoices'
import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice } from '@/lib/types'
import { calculateEntryMoney, fallbackFromClient } from '@/lib/finance/entry-calculations'
import { sum, toDb, zero } from '@/lib/finance/money'
import {
  invoiceSettingsSchema,
  resolveInvoiceSettings as parseInvoiceSettings,
} from '@/lib/schemas/invoice-settings.schema'
import { formatInvoiceNumber, sanitizeInvoicePrefix } from '@/lib/finance/invoice-number'
import { INVOICE_STATUS_VALUES, InvoiceStatus } from '@/lib/finance/invoice-status'
import type { InvoiceLifecycleStatus } from '@/lib/types'
import type { AutoIssueResult, InvoiceSettings, InvoicesData, SaveInvoiceInput } from '../domain'

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = invoiceSettingsSchema.parse({})

function resolveInvoiceSettings(rawMetadata: unknown): InvoiceSettings {
  return parseInvoiceSettings(rawMetadata, (issues) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[invoice-settings] metadata did not match schema, using defaults:', issues)
    }
  })
}

function pad(num: number) {
  return String(num).padStart(2, '0')
}

function formatDateIso(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function resolveIssueDate(dayOfWeek = 6) {
  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = (todayUtc.getUTCDay() - dayOfWeek + 7) % 7
  todayUtc.setUTCDate(todayUtc.getUTCDate() - diff)
  return todayUtc
}

async function reserveNextInvoiceNumber({
  supabase,
  userId,
  prefix,
  issueDate,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  prefix: string
  issueDate: Date
}) {
  const { data, error } = await supabase.rpc('reserve_invoice_sequence', {
    p_user_id: userId,
    p_prefix: prefix,
    p_issue_date: formatDateIso(issueDate),
  })

  if (error) throw new Error(error.message)
  const seq = Number(data)
  if (!Number.isFinite(seq) || seq <= 0) {
    throw new Error('Nie udało się zarezerwować kolejnego numeru faktury')
  }

  return formatInvoiceNumber(prefix, seq, issueDate)
}

function parseIssueDateSafe(value: string | null | undefined): Date {
  if (value) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function shouldRunAutoIssueToday(settings: InvoiceSettings) {
  if (!settings.autoIssueEnabled) return false

  const now = new Date()
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const configuredDay = 6
  return todayUtc.getUTCDay() === configuredDay
}

function resolveWeeklyPeriod(issueDate: Date) {
  const periodEnd = formatDateIso(issueDate)
  const periodStartDate = new Date(issueDate)
  periodStartDate.setUTCDate(periodStartDate.getUTCDate() - 6)
  const periodStart = formatDateIso(periodStartDate)
  return {
    periodStart,
    periodEnd,
    billingPeriod: `TYDZIEN ${periodStart} - ${periodEnd}`,
  }
}

function isFirstSaturdayInMonth(issueDate: Date) {
  return issueDate.getUTCDate() <= 7
}

function resolveMonthlyPeriod(issueDate: Date) {
  const year = issueDate.getUTCFullYear()
  const month = issueDate.getUTCMonth()
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  const periodStart = formatDateIso(start)
  const periodEnd = formatDateIso(end)
  return {
    periodStart,
    periodEnd,
    billingPeriod: `MIESIAC ${periodStart} - ${periodEnd}`,
  }
}

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

type ClientUpsertExtras = Partial<{
  nip: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country_code: string | null
  email: string | null
}>

async function createClientIfNeeded(
  name: string,
  userId: string,
  extras: ClientUpsertExtras = {},
): Promise<string | null> {
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

  if (existing.data?.id) {
    // Only set fields that arrived from the form — never wipe existing data.
    const patch = pruneEmpty(extras)
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase
        .from('clients')
        .update(patch)
        .eq('id', existing.data.id)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
    }
    return existing.data.id
  }

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
      ...pruneEmpty(extras),
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

function pruneEmpty<T extends Record<string, unknown>>(patch: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, value] of Object.entries(patch) as Array<[keyof T, T[keyof T]]>) {
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    out[key] = value
  }
  return out
}

function buyerToClientPatch(buyer: SaveInvoiceInput['values']['buyer']): ClientUpsertExtras {
  if (!buyer) return {}
  return pruneEmpty({
    nip:          buyer.tax_id?.trim(),
    address:      buyer.address?.trim(),
    city:         buyer.city?.trim(),
    postal_code:  buyer.postal_code?.trim(),
    country_code: buyer.country_code?.trim().toUpperCase(),
    email:        buyer.email?.trim(),
  })
}

async function persistInvoiceLineItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  userId: string,
  items: NonNullable<SaveInvoiceInput['values']['line_items']>,
) {
  // Replace strategy: clear then insert. The DB trigger keeps invoice
  // totals in sync; we don't need to recompute on the client.
  const { error: deleteError } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId)
  if (deleteError) throw new Error(deleteError.message)

  if (items.length === 0) return

  const rows = items.map((item, index) => ({
    invoice_id:     invoiceId,
    user_id:        userId,
    position:       index + 1,
    description:    item.description.trim() || `Pozycja ${index + 1}`,
    unit:           item.unit?.trim() || 'szt.',
    quantity:       item.quantity,
    unit_price_net: item.unit_price_net,
    vat_rate:       item.vat_rate,
  }))

  const { error } = await supabase.from('invoice_line_items').insert(rows)
  if (error) throw new Error(error.message)
}

const getInvoicesDataServerCached = cache(async (): Promise<InvoicesData> => {
  noStore()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { invoices: [], clients: [], settings: DEFAULT_INVOICE_SETTINGS }
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
    settings: resolveInvoiceSettings(user.user_metadata),
  }
})

export async function getInvoicesDataServer(): Promise<InvoicesData> {
  return getInvoicesDataServerCached()
}

export async function saveInvoiceAction({ invoiceId, values }: SaveInvoiceInput) {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()

  // Step 1: resolve existing invoice (needed for cleaning up the replaced PDF later
  // and for preserving the lifecycle status when the form doesn't override it).
  let previousFileUrl: string | null = null
  let previousStatus: InvoiceLifecycleStatus | null = null
  let previousInvoiceNumber: string | null = null
  if (invoiceId) {
    const { data: existing, error: fetchError } = await supabase
      .from('invoices')
      .select('file_url, status, invoice_number')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .maybeSingle()
    if (fetchError) throw new Error(fetchError.message)
    if (!existing) throw new Error('Nie znaleziono faktury do edycji')
    previousFileUrl = existing.file_url ?? null
    previousStatus = (existing.status as InvoiceLifecycleStatus | null) ?? null
    previousInvoiceNumber = existing.invoice_number ?? null
  }

  const buyerPatch = buyerToClientPatch(values.buyer)
  let resolvedClientId = values.client_id
  if (resolvedClientId) {
    // Selected an existing client: enrich it with anything the user typed
    // into the buyer block that isn't already on the record.
    if (Object.keys(buyerPatch).length > 0) {
      const { error } = await supabase
        .from('clients')
        .update(buyerPatch)
        .eq('id', resolvedClientId)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
    }
  } else {
    // No client selected — fall back to the typed name. We pass the buyer
    // patch so a freshly-created client carries NIP/address from the form
    // instead of being a bare name shell.
    resolvedClientId = await createClientIfNeeded(values.new_client_name, userId, buyerPatch)
  }

  // Step 2: upload PDF only if the user provided one. Keep filePath handy so we
  // can delete the orphan if the DB write fails below.
  const uploaded = values.file
    ? await uploadInvoicePdfWithMeta({ supabase, userId, file: values.file })
    : null

  // Step 2b: resolve the business-friendly invoice number.
  // Every invoice — including drafts and legacy rows being edited — must carry a
  // business number. On create we reserve one whenever the form leaves it blank.
  // On edit we preserve the existing number rather than reserving a fresh sequence
  // every save (that would burn invoice numbers each time the user opens the form
  // and clears the field by accident).
  let resolvedInvoiceNumber: string | null = values.invoice_number.trim() || null
  if (!resolvedInvoiceNumber && invoiceId && previousInvoiceNumber) {
    resolvedInvoiceNumber = previousInvoiceNumber
  }
  if (!resolvedInvoiceNumber) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const settings = resolveInvoiceSettings(user?.user_metadata)
    const prefix = sanitizeInvoicePrefix(settings.userPrefix || settings.series)
    const issueDate = parseIssueDateSafe(values.invoice_date)
    resolvedInvoiceNumber = await reserveNextInvoiceNumber({
      supabase,
      userId,
      prefix,
      issueDate,
    })
  }

  // Step 2c: resolve the lifecycle status.
  // - Form passes `status`     → honor it (user explicitly picked one).
  // - New invoice, no override → default to SENT (manual issuance is "issued").
  // - Edit, no override        → preserve the existing status so unrelated form
  //                              edits don't silently regress SENT/PAID rows.
  const requestedStatus = values.status
  const resolvedStatus: InvoiceLifecycleStatus = requestedStatus
    ? requestedStatus
    : invoiceId
      ? (previousStatus ?? InvoiceStatus.SENT)
      : (values.is_paid ? InvoiceStatus.PAID : InvoiceStatus.SENT)

  const payload = {
    user_id: userId,
    client_id: resolvedClientId,
    name: values.name.trim(),
    invoice_number: resolvedInvoiceNumber,
    recipient: (values.recipient || values.new_client_name || '').trim() || null,
    billing_period: values.billing_period.trim() || `${values.billing_quarter} ${values.billing_year}`,
    issue_date: values.invoice_date,
    invoice_date: values.invoice_date,
    amount: values.amount,
    currency: values.currency,
    is_paid: values.is_paid,
    status: resolvedStatus,
    file_url: uploaded?.publicUrl ?? null,
    notes: values.notes.trim() || null,
    template_key: values.template_key,
  }

  // Step 3: DB write with compensating cleanup on failure.
  let savedInvoiceId = invoiceId ?? null
  try {
    if (invoiceId) {
      const updatePayload: typeof payload = {
        ...payload,
        // Keep existing file_url if no new PDF was uploaded.
        file_url: uploaded?.publicUrl ?? previousFileUrl,
      }
      const { error } = await supabase
        .from('invoices')
        .update(updatePayload)
        .eq('id', invoiceId)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
    } else {
      const { data, error } = await supabase
        .from('invoices')
        .insert(payload)
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      savedInvoiceId = data?.id ?? null
    }

    // Step 3b: persist line items if the caller supplied them. Done inside
    // the try/catch so a failure here still triggers the PDF cleanup path.
    if (savedInvoiceId && values.line_items) {
      await persistInvoiceLineItems(supabase, savedInvoiceId, userId, values.line_items)
    }
  } catch (err) {
    // DB write failed → remove the orphan PDF we just uploaded.
    if (uploaded) {
      await removeInvoicePdf(supabase, uploaded.filePath, uploaded.bucket)
    }
    throw err
  }

  // Step 4: on a successful update with a replaced PDF, delete the previous file.
  if (invoiceId && uploaded && previousFileUrl && previousFileUrl !== uploaded.publicUrl) {
    const oldPath = extractInvoicePdfPath(previousFileUrl)
    if (oldPath) {
      await removeInvoicePdf(supabase, oldPath)
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function runAutoIssueInvoicesAction(): Promise<AutoIssueResult> {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const settings = resolveInvoiceSettings(user?.user_metadata)
  const userPrefix = sanitizeInvoicePrefix(settings.userPrefix || settings.series)
  const issueDate = resolveIssueDate(6)
  const fallbackPeriod = resolveWeeklyPeriod(issueDate)

  if (!shouldRunAutoIssueToday(settings)) {
    return { created: 0, skipped: 0, periodStart: fallbackPeriod.periodStart, periodEnd: fallbackPeriod.periodEnd }
  }

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, rate, currency, work_type, auto_invoice_enabled, auto_invoice_frequency')
    .eq('user_id', userId)
    .eq('auto_invoice_enabled', true)

  if (clientsError) throw new Error(clientsError.message)
  if (!clients?.length) {
    return { created: 0, skipped: 0, periodStart: fallbackPeriod.periodStart, periodEnd: fallbackPeriod.periodEnd }
  }

  let created = 0
  let skipped = 0
  let firstPeriodStart = fallbackPeriod.periodStart
  let firstPeriodEnd = fallbackPeriod.periodEnd

  for (const client of clients) {
    const frequency = client.auto_invoice_frequency === 'monthly' ? 'monthly' : 'weekly'
    if (frequency === 'monthly' && !isFirstSaturdayInMonth(issueDate)) {
      skipped += 1
      continue
    }

    const period = frequency === 'monthly' ? resolveMonthlyPeriod(issueDate) : resolveWeeklyPeriod(issueDate)
    firstPeriodStart = period.periodStart
    firstPeriodEnd = period.periodEnd

    const { data: existingInvoices, error: existingError } = await supabase
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('client_id', client.id)
      .eq('billing_period', period.billingPeriod)
      .eq('auto_generated', true)

    if (existingError) throw new Error(existingError.message)
    if ((existingInvoices ?? []).length > 0) {
      skipped += 1
      continue
    }

    const { data: entries, error: entriesError } = await supabase
      .from('work_entries')
      .select('status, hours, quantity, quantity_from, quantity_to, billing_rate, billing_currency, billing_work_type')
      .eq('user_id', userId)
      .eq('client_id', client.id)
      .gte('date', period.periodStart)
      .lte('date', period.periodEnd)

    if (entriesError) throw new Error(entriesError.message)

    const invoiceCurrency = (client.currency as 'PLN' | 'EUR') ?? 'PLN'
    const clientFallback = fallbackFromClient({
      rate: Number(client.rate ?? 0),
      currency: invoiceCurrency,
      work_type: client.work_type === 'piecework' ? 'piecework' : 'hourly',
    })

    const entryMoneys = (entries ?? [])
      .map((entry) => calculateEntryMoney(entry, clientFallback))
      .filter((m) => m.currency === invoiceCurrency)

    const totalMoney = entryMoneys.length > 0 ? sum(entryMoneys, invoiceCurrency) : zero(invoiceCurrency)
    const amount = toDb(totalMoney)

    if (amount <= 0) {
      skipped += 1
      continue
    }

    const dueDate = new Date(issueDate)
    dueDate.setUTCDate(dueDate.getUTCDate() + settings.dueDays)

    const invoicePayload: Record<string, unknown> = {
      user_id: userId,
      client_id: client.id,
      name: `Auto faktura ${client.name} (${period.periodStart} - ${period.periodEnd})`,
      recipient: client.name,
      billing_period: period.billingPeriod,
      issue_date: formatDateIso(issueDate),
      invoice_date: formatDateIso(issueDate),
      due_date: formatDateIso(dueDate),
      amount,
      currency: invoiceCurrency,
      is_paid: false,
      status: InvoiceStatus.SENT,
      notes: 'Wygenerowano automatycznie z przepracowanych wpisów w kalendarzu.',
      template_key: settings.defaultTemplate,
      template_accent_color: settings.templateAccentColor,
      template_footer: settings.templateFooter,
      auto_generated: true,
      period_start: period.periodStart,
      period_end: period.periodEnd,
    }

    let inserted = false
    let attempts = 0

    while (!inserted && attempts < 3) {
      attempts += 1
      const invoiceNumber = await reserveNextInvoiceNumber({ supabase, userId, prefix: userPrefix, issueDate })
      const { error: insertError } = await supabase.from('invoices').insert({
        ...invoicePayload,
        invoice_number: invoiceNumber,
      })

      if (!insertError) {
        inserted = true
        created += 1
        continue
      }

      if (insertError.code !== '23505') {
        throw new Error(insertError.message)
      }
    }

    if (!inserted) {
      throw new Error('Nie udało się zapisać auto-faktury przez konflikt numeracji')
    }
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')

  return { created, skipped, periodStart: firstPeriodStart, periodEnd: firstPeriodEnd }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()

  // Fetch file_url first so we can clean up Storage after the DB row is gone.
  const { data: existing, error: fetchError } = await supabase
    .from('invoices')
    .select('file_url')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error('Nie znaleziono faktury do usunięcia')

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)

  const storagePath = extractInvoicePdfPath(existing?.file_url ?? null)
  if (storagePath) {
    await removeInvoicePdf(supabase, storagePath)
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

export async function updateInvoicePaidStatusAction(invoiceId: string, isPaid: boolean) {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ is_paid: isPaid })
    .eq('id', invoiceId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}

/**
 * Change the lifecycle status of an invoice. The DB trigger
 * `sync_invoice_payment_flag` keeps `is_paid` and `paid_date` consistent — we
 * only need to write `status` and the trigger handles the rest.
 */
export async function updateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceLifecycleStatus,
) {
  if (!(INVOICE_STATUS_VALUES as readonly string[]).includes(status)) {
    throw new Error(`Niepoprawny status faktury: ${status}`)
  }

  const userId = await fetchCurrentUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
