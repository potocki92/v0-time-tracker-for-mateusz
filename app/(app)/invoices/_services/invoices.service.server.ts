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
  autoIssueDay: 6,
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

function resolveIssueDate(dayOfWeek: number) {
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
  const configuredDay = Number.isInteger(settings.autoIssueDay) ? settings.autoIssueDay : 6
  return todayUtc.getUTCDay() === configuredDay
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

  if (!shouldRunAutoIssueToday(settings)) {
    const issueDate = resolveIssueDate(settings.autoIssueDay)
    const periodEnd = formatDateIso(issueDate)
    const periodStartDate = new Date(issueDate)
    periodStartDate.setUTCDate(periodStartDate.getUTCDate() - 6)
    const periodStart = formatDateIso(periodStartDate)
    return { created: 0, skipped: 0, periodStart, periodEnd }
  }

  const issueDate = resolveIssueDate(settings.autoIssueDay)
  const periodEnd = formatDateIso(issueDate)
  const periodStartDate = new Date(issueDate)
  periodStartDate.setUTCDate(periodStartDate.getUTCDate() - 6)
  const periodStart = formatDateIso(periodStartDate)
  const billingPeriod = `TYDZIEN ${periodStart} - ${periodEnd}`

  const { data: existingInvoices, error: existingError } = await supabase
    .from('invoices')
    .select('id')
    .eq('user_id', userId)
    .eq('billing_period', billingPeriod)
    .eq('auto_generated', true)

  if (existingError) throw new Error(existingError.message)

  if ((existingInvoices ?? []).length > 0) {
    return { created: 0, skipped: existingInvoices?.length ?? 0, periodStart, periodEnd }
  }

  const { data: entries, error: entriesError } = await supabase
    .from('work_entries')
    .select('client_id, hours')
    .eq('user_id', userId)
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .not('client_id', 'is', null)
    .gt('hours', 0)

  if (entriesError) throw new Error(entriesError.message)
  if (!entries?.length) {
    return { created: 0, skipped: 0, periodStart, periodEnd }
  }

  const clientHours = new Map<string, number>()
  for (const entry of entries) {
    const clientId = entry.client_id as string
    const total = clientHours.get(clientId) ?? 0
    clientHours.set(clientId, total + Number(entry.hours ?? 0))
  }

  const clientIds = [...clientHours.keys()]
  const [clientsRes, ratesRes] = await Promise.all([
    supabase.from('clients').select('id, name, rate, currency').in('id', clientIds),
    supabase
      .from('client_rates')
      .select('client_id, rate, currency, effective_from')
      .in('client_id', clientIds)
      .lte('effective_from', periodEnd)
      .order('effective_from', { ascending: false }),
  ])
  if (clientsRes.error) throw new Error(clientsRes.error.message)
  if (ratesRes.error) throw new Error(ratesRes.error.message)

  const newestRateByClient = new Map<string, { rate: number; currency: 'PLN' | 'EUR' }>()
  for (const rate of ratesRes.data ?? []) {
    if (!newestRateByClient.has(rate.client_id)) {
      newestRateByClient.set(rate.client_id, {
        rate: Number(rate.rate ?? 0),
        currency: (rate.currency as 'PLN' | 'EUR') ?? 'PLN',
      })
    }
  }

  const insertPayload: Array<Record<string, unknown>> = []
  for (const client of clientsRes.data ?? []) {
    const hours = clientHours.get(client.id) ?? 0
    if (hours <= 0) continue
    const rate = newestRateByClient.get(client.id) ?? { rate: Number(client.rate ?? 0), currency: client.currency as 'PLN' | 'EUR' }
    const amount = Number((hours * rate.rate).toFixed(2))
    if (amount <= 0) continue

    const dueDate = new Date(issueDate)
    dueDate.setUTCDate(dueDate.getUTCDate() + settings.dueDays)

    insertPayload.push({
      user_id: userId,
      client_id: client.id,
      name: `Auto faktura ${client.name} (${periodStart} - ${periodEnd})`,
      recipient: client.name,
      billing_period: billingPeriod,
      issue_date: periodEnd,
      invoice_date: periodEnd,
      due_date: formatDateIso(dueDate),
      amount,
      currency: rate.currency,
      is_paid: false,
      notes: `Wygenerowano automatycznie na podstawie przepracowanych godzin (${hours.toFixed(2)} h).`,
      template_key: settings.defaultTemplate,
      template_accent_color: settings.templateAccentColor,
      template_footer: settings.templateFooter,
      auto_generated: true,
      period_start: periodStart,
      period_end: periodEnd,
    })
  }

  if (insertPayload.length === 0) {
    return { created: 0, skipped: clientIds.length, periodStart, periodEnd }
  }

  let created = 0

  for (const invoicePayload of insertPayload) {
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

  return { created, skipped: 0, periodStart, periodEnd }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw new Error(error.message)

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
}
