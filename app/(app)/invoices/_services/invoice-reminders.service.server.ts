'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  classifyReminderKind,
  renderReminder,
  type ReminderCandidate,
  type ReminderKind,
} from '@/lib/finance/reminder-engine'

export interface DispatchReminderSummary {
  scanned: number
  sent: number
  skipped: number
  errors: Array<{ invoice_id: string; message: string }>
}

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Brak autoryzacji użytkownika')
  return user.id
}

/**
 * Calls the 'send-email' Edge Function (which owns the Supabase SMTP
 * configuration) to deliver a single message. The Edge Function is expected
 * to accept { to, subject, text, html } and forward to Supabase SMTP.
 */
async function dispatchEmail(input: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.functions.invoke('send-email', { body: input })
  if (error) throw new Error(error.message ?? 'Nie udało się wysłać emaila')
}

async function alreadySentToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
  kind: ReminderKind,
) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('invoice_reminders_sent')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('reminder_kind', kind)
    .is('error_message', null)
    .gte('sent_at', `${today}T00:00:00Z`)
    .limit(1)
    .maybeSingle()
  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return !!data
}

/**
 * Send one targeted reminder (used for "Remind now" button in the UI).
 */
export async function sendManualReminderAction(invoiceId: string): Promise<void> {
  const userId = await currentUserId()
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('v_invoice_reminder_candidates')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!row) throw new Error('Brak odbiorcy e-mail lub klient wyłączył przypomnienia')

  const candidate: ReminderCandidate = {
    invoice_id: row.invoice_id,
    invoice_number: row.invoice_number,
    invoice_name: row.name,
    due_date: row.due_date,
    amount: Number(row.amount),
    currency: row.currency,
    client_email: row.client_email,
    client_name: row.client_name,
    user_id: row.user_id,
  }

  const { subject, text, html } = renderReminder(candidate, 'MANUAL')

  try {
    await dispatchEmail({ to: candidate.client_email, subject, text, html })
    await supabase.from('invoice_reminders_sent').insert({
      invoice_id: invoiceId,
      user_id: userId,
      reminder_kind: 'MANUAL',
      recipient_email: candidate.client_email,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await supabase.from('invoice_reminders_sent').insert({
      invoice_id: invoiceId,
      user_id: userId,
      reminder_kind: 'MANUAL',
      recipient_email: candidate.client_email,
      error_message: message,
    })
    throw err
  }

  revalidatePath('/invoices')
}

/**
 * Cron-invoked handler: scan all reminder candidates for the current user,
 * classify each by policy and dispatch the appropriate email (idempotent).
 * Used both from the UI ("Send reminders now") and from the daily cron job.
 */
export async function dispatchScheduledRemindersAction(): Promise<DispatchReminderSummary> {
  const userId = await currentUserId()
  const supabase = await createClient()

  const { data: candidates, error } = await supabase
    .from('v_invoice_reminder_candidates')
    .select('*')
    .eq('user_id', userId)
    .not('reminder_kind', 'is', null)
  if (error) throw new Error(error.message)

  const summary: DispatchReminderSummary = { scanned: candidates?.length ?? 0, sent: 0, skipped: 0, errors: [] }

  for (const row of candidates ?? []) {
    const kind = (row.reminder_kind as ReminderKind | null) ?? classifyReminderKind(row.due_date)
    if (!kind) {
      summary.skipped += 1
      continue
    }
    if (await alreadySentToday(supabase, row.invoice_id, kind)) {
      summary.skipped += 1
      continue
    }

    const candidate: ReminderCandidate = {
      invoice_id: row.invoice_id,
      invoice_number: row.invoice_number,
      invoice_name: row.name,
      due_date: row.due_date,
      amount: Number(row.amount),
      currency: row.currency,
      client_email: row.client_email,
      client_name: row.client_name,
      user_id: row.user_id,
    }
    const { subject, text, html } = renderReminder(candidate, kind)

    try {
      await dispatchEmail({ to: candidate.client_email, subject, text, html })
      await supabase.from('invoice_reminders_sent').insert({
        invoice_id: row.invoice_id,
        user_id: userId,
        reminder_kind: kind,
        recipient_email: candidate.client_email,
      })
      summary.sent += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await supabase.from('invoice_reminders_sent').insert({
        invoice_id: row.invoice_id,
        user_id: userId,
        reminder_kind: kind,
        recipient_email: candidate.client_email,
        error_message: message,
      })
      summary.errors.push({ invoice_id: row.invoice_id, message })
    }
  }

  revalidatePath('/invoices')
  return summary
}

/**
 * Promote SENT invoices past their due date to OVERDUE by calling the SQL
 * helper. Suitable for a once-a-day scheduled trigger.
 */
export async function markOverdueInvoicesAction(): Promise<number> {
  await currentUserId()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('mark_overdue_invoices')
  if (error) throw new Error(error.message)
  revalidatePath('/invoices')
  revalidatePath('/dashboard')
  return Number(data ?? 0)
}
