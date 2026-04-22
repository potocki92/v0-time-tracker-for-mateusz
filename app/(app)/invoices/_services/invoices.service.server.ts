'use server'

import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { cache } from 'react'
import { uploadInvoicePdf } from '@/services/invoices'
import { createClient } from '@/lib/supabase/server'
import type { Client, Invoice } from '@/lib/types'
import type { AutoIssueResult, InvoiceSettings, InvoicesData, SaveInvoiceInput } from '../_domain'

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  userPrefix: 'FV',
  numberingPattern: 'FV/{SERIA}/{YYYY}/{MM}/{SEQ}',
  series: 'A',
  branch: 'HQ',
  resetSequence: 'monthly',
  defaultTemplate: 'classic',
  templateAccentColor: '#1d4ed8',
  templateFooter: 'Dziękujemy za współpracę.',
  autoIssueEnabled: false,
  dueDays: 7,
}

type UserMetadata = {
  invoice_settings?: Partial<InvoiceSettings>
}

function resolveInvoiceSettings(metadata: UserMetadata | null | undefined): InvoiceSettings {
  return {
    ...DEFAULT_INVOICE_SETTINGS,
    ...(metadata?.invoice_settings ?? {}),
  }
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

function sanitizePrefix(prefix: string | null | undefined) {
  const normalized = (prefix ?? '').trim().toUpperCase()
  return normalized || 'FV'
}

function buildInvoiceNumberLabel(prefix: string, seq: number, issueDate: Date) {
  const year = issueDate.getUTCFullYear()
  const month = issueDate.getUTCMonth() + 1
  return `${prefix} ${seq}/${pad(month)}/${year}`
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

  return buildInvoiceNumberLabel(prefix, seq, issueDate)
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

function calculateEntryAmount(
  entry: {
    status: string
    hours: number | null
    quantity: number | null
    quantity_from: number | null
    quantity_to: number | null
    billing_rate: number | null
    billing_work_type: 'hourly' | 'piecework' | null
  },
  fallback: {
    rate: number
    workType: 'hourly' | 'piecework'
  },
) {
  if (entry.status !== 'worked') return 0

  const rate = Number(entry.billing_rate ?? fallback.rate ?? 0)
  if (!Number.isFinite(rate) || rate <= 0) return 0

  const workType = entry.billing_work_type ?? fallback.workType
  if (workType === 'piecework') {
    const quantity = Number(entry.quantity ?? ((entry.quantity_to ?? 0) - (entry.quantity_from ?? 0)))
    return Number.isFinite(quantity) && quantity > 0 ? quantity * rate : 0
  }

  const hours = Number(entry.hours ?? 0)
  return Number.isFinite(hours) && hours > 0 ? hours * rate : 0
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
    settings: resolveInvoiceSettings((user.user_metadata ?? {}) as UserMetadata),
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
    template_key: values.template_key,
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

export async function runAutoIssueInvoicesAction(): Promise<AutoIssueResult> {
  const userId = await fetchCurrentUserId()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const settings = resolveInvoiceSettings((user?.user_metadata ?? {}) as UserMetadata)
  const userPrefix = sanitizePrefix(settings.userPrefix || settings.series)
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
    return { created: 0, skipped: 1, periodStart: fallbackPeriod.periodStart, periodEnd: fallbackPeriod.periodEnd }
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
      .select('status, hours, quantity, quantity_from, quantity_to, billing_rate, billing_work_type')
      .eq('user_id', userId)
      .eq('client_id', client.id)
      .gte('date', period.periodStart)
      .lte('date', period.periodEnd)

    if (entriesError) throw new Error(entriesError.message)

    const amount = Number(
      (entries ?? []).reduce(
        (sum, entry) =>
          sum +
          calculateEntryAmount(entry, {
            rate: Number(client.rate ?? 0),
            workType: client.work_type === 'piecework' ? 'piecework' : 'hourly',
          }),
        0,
      ).toFixed(2),
    )

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
      currency: (client.currency as 'PLN' | 'EUR') ?? 'PLN',
      is_paid: false,
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
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
