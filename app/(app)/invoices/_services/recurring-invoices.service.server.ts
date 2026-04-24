'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recurringInvoiceSchema, type RecurringInvoiceInput } from '@/lib/schemas/recurring-invoice.schema'
import {
  computeDueDate,
  findDueRecurringInvoices,
  nextIssueDate,
  type ScheduleCandidate,
} from '@/lib/finance/recurring-schedule'
import { computeInvoiceTotals } from '@/lib/finance/invoice-totals'

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Brak autoryzacji użytkownika')
  return user.id
}

export async function createOrUpdateRecurringInvoiceAction(
  recurringId: string | null,
  raw: unknown,
): Promise<{ id: string }> {
  const userId = await currentUserId()
  const parsed = recurringInvoiceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join('; '))
  }
  const values = parsed.data as RecurringInvoiceInput

  const supabase = await createClient()
  const payload = {
    user_id: userId,
    client_id: values.client_id ?? null,
    name: values.name,
    description: values.description ?? null,
    currency: values.currency,
    template_key: values.template_key,
    template_accent_color: values.template_accent_color ?? null,
    template_footer: values.template_footer ?? null,
    notes: values.notes ?? null,
    frequency: values.frequency,
    due_days: values.due_days,
    start_date: values.start_date,
    end_date: values.end_date ?? null,
    next_issue_date: values.next_issue_date,
    is_active: values.is_active,
    line_items: values.line_items,
  }

  if (recurringId) {
    const { data, error } = await supabase
      .from('recurring_invoices')
      .update(payload)
      .eq('id', recurringId)
      .eq('user_id', userId)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    revalidatePath('/invoices')
    return { id: data.id }
  }

  const { data, error } = await supabase
    .from('recurring_invoices')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
  return { id: data.id }
}

export async function pauseRecurringInvoiceAction(recurringId: string, pause: boolean): Promise<void> {
  const userId = await currentUserId()
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_invoices')
    .update({ paused_at: pause ? new Date().toISOString() : null })
    .eq('id', recurringId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
}

export async function deleteRecurringInvoiceAction(recurringId: string): Promise<void> {
  const userId = await currentUserId()
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_invoices')
    .delete()
    .eq('id', recurringId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
}

export interface IssueRecurringSummary {
  scanned: number
  issued: number
  skipped: number
  errors: Array<{ id: string; message: string }>
}

/**
 * Daily cron handler: find all recurring invoices that are due for today,
 * materialise them as real invoices + line items, and advance next_issue_date.
 */
export async function issueDueRecurringInvoicesAction(): Promise<IssueRecurringSummary> {
  const userId = await currentUserId()
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('recurring_invoices')
    .select(
      'id, frequency, next_issue_date, end_date, is_active, paused_at, client_id, name, description, currency, template_key, template_accent_color, template_footer, notes, due_days, line_items',
    )
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw new Error(error.message)

  const summary: IssueRecurringSummary = { scanned: rows?.length ?? 0, issued: 0, skipped: 0, errors: [] }

  const schedulables: ScheduleCandidate[] = (rows ?? []).map((row) => ({
    id: row.id,
    frequency: row.frequency,
    next_issue_date: row.next_issue_date,
    end_date: row.end_date,
    is_active: row.is_active,
    paused_at: row.paused_at,
  }))

  const due = findDueRecurringInvoices(schedulables)
  const byId = new Map(rows?.map((row) => [row.id, row]) ?? [])

  for (const entry of due) {
    const template = byId.get(entry.id)
    if (!template) {
      summary.skipped += 1
      continue
    }

    const lineItems = Array.isArray(template.line_items)
      ? (template.line_items as Array<{ description: string; unit?: string; quantity: number; unit_price_net: number; vat_rate: number }>)
      : []
    if (lineItems.length === 0) {
      summary.skipped += 1
      continue
    }

    const totals = computeInvoiceTotals(lineItems, template.currency)
    const dueDate = computeDueDate(entry.issueDate, template.due_days ?? 14)

    const { data: inserted, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        client_id: template.client_id,
        name: template.name,
        recipient: null,
        description: template.description,
        billing_period: null,
        issue_date: entry.issueDate,
        invoice_date: entry.issueDate,
        due_date: dueDate,
        amount: totals.gross_amount,
        net_amount: totals.net_amount,
        vat_amount: totals.vat_amount,
        gross_amount: totals.gross_amount,
        currency: template.currency,
        is_paid: false,
        status: 'SENT',
        notes: template.notes,
        template_key: template.template_key,
        template_accent_color: template.template_accent_color,
        template_footer: template.template_footer,
        auto_generated: true,
      })
      .select('id')
      .single()

    if (invoiceError || !inserted) {
      summary.errors.push({ id: entry.id, message: invoiceError?.message ?? 'Nie udało się utworzyć faktury' })
      continue
    }

    const itemRows = lineItems.map((item, index) => ({
      invoice_id: inserted.id,
      user_id: userId,
      position: index + 1,
      description: item.description,
      unit: item.unit ?? 'szt.',
      quantity: item.quantity,
      unit_price_net: item.unit_price_net,
      vat_rate: item.vat_rate,
    }))
    const { error: lineError } = await supabase.from('invoice_line_items').insert(itemRows)
    if (lineError) {
      summary.errors.push({ id: entry.id, message: lineError.message })
      // Roll back the invoice row to avoid empty shells.
      await supabase.from('invoices').delete().eq('id', inserted.id)
      continue
    }

    const { error: advanceError } = await supabase
      .from('recurring_invoices')
      .update({
        last_issued_date: entry.issueDate,
        next_issue_date: entry.newNextIssueDate,
      })
      .eq('id', entry.id)
      .eq('user_id', userId)

    if (advanceError) {
      summary.errors.push({ id: entry.id, message: advanceError.message })
      continue
    }

    summary.issued += 1
  }

  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return summary
}

/**
 * Helper for the UI: when the user picks start_date and frequency, suggest
 * the first next_issue_date (same as start_date in simple cases).
 */
export async function previewRecurringSchedule(
  startDate: string,
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  runs = 3,
): Promise<string[]> {
  const dates: string[] = [startDate]
  let cursor = startDate
  for (let i = 1; i < runs; i += 1) {
    cursor = nextIssueDate(cursor, frequency)
    dates.push(cursor)
  }
  return dates
}
