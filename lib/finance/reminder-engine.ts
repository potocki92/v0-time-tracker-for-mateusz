import type { CURRENCY } from '@/lib/types'
import { format as formatMoney, fromMajor } from './money'

export const REMINDER_KINDS = [
  'UPCOMING_3D',
  'DUE_TODAY',
  'OVERDUE_3D',
  'OVERDUE_7D',
  'OVERDUE_14D',
  'MANUAL',
] as const

export type ReminderKind = (typeof REMINDER_KINDS)[number]

export interface ReminderCandidate {
  invoice_id: string
  invoice_number: string | null
  invoice_name: string
  due_date: string
  amount: number
  currency: CURRENCY
  client_email: string
  client_name: string | null
  user_id: string
}

/**
 * Pure policy function: given a due date and "today", decide which reminder
 * (if any) should fire. Returns null when no reminder is due.
 */
export function classifyReminderKind(dueDate: string, today: Date = new Date()): ReminderKind | null {
  const due = new Date(`${dueDate}T00:00:00Z`)
  if (Number.isNaN(due.getTime())) return null
  const todayIso = today.toISOString().slice(0, 10)
  const todayMidnight = new Date(`${todayIso}T00:00:00Z`)
  const diffDays = Math.round((due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 3) return 'UPCOMING_3D'
  if (diffDays === 0) return 'DUE_TODAY'
  if (diffDays === -3) return 'OVERDUE_3D'
  if (diffDays === -7) return 'OVERDUE_7D'
  if (diffDays === -14) return 'OVERDUE_14D'
  return null
}

export interface RenderedReminder {
  subject: string
  text: string
  html: string
}

function formatAmount(amount: number, currency: CURRENCY): string {
  return formatMoney(fromMajor(amount, currency))
}

function headline(kind: ReminderKind): string {
  switch (kind) {
    case 'UPCOMING_3D':
      return 'Przypomnienie: faktura wkrótce do opłacenia'
    case 'DUE_TODAY':
      return 'Dzisiaj upływa termin płatności'
    case 'OVERDUE_3D':
      return 'Faktura po terminie (3 dni)'
    case 'OVERDUE_7D':
      return 'Faktura po terminie (7 dni)'
    case 'OVERDUE_14D':
      return 'Pilne: faktura zaległa 14 dni'
    case 'MANUAL':
      return 'Przypomnienie o niezapłaconej fakturze'
  }
}

export function renderReminder(
  candidate: ReminderCandidate,
  kind: ReminderKind,
): RenderedReminder {
  const invoiceLabel = candidate.invoice_number ?? candidate.invoice_name
  const amount = formatAmount(candidate.amount, candidate.currency)
  const subject = `${headline(kind)} — ${invoiceLabel}`

  const greeting = candidate.client_name ? `Dzień dobry, ${candidate.client_name}` : 'Dzień dobry'
  const dueLine =
    kind === 'DUE_TODAY'
      ? 'Termin płatności przypada na dzisiaj.'
      : kind === 'UPCOMING_3D'
        ? `Termin płatności przypada na ${candidate.due_date}.`
        : `Termin płatności minął ${candidate.due_date}.`

  const text = [
    greeting + ',',
    '',
    `przypominamy o fakturze ${invoiceLabel} na kwotę ${amount}.`,
    dueLine,
    '',
    'Jeśli płatność została już zrealizowana, prosimy o zignorowanie tej wiadomości.',
    '',
    'Pozdrawiamy',
  ].join('\n')

  const html = `<!doctype html>
<html>
  <body style="font-family: Helvetica, Arial, sans-serif; color: #111827; line-height: 1.5;">
    <p>${greeting},</p>
    <p>przypominamy o fakturze <strong>${invoiceLabel}</strong> na kwotę <strong>${amount}</strong>.</p>
    <p>${dueLine}</p>
    <p style="color:#6b7280;font-size:12px;">
      Jeśli płatność została już zrealizowana, prosimy o zignorowanie tej wiadomości.
    </p>
    <p>Pozdrawiamy</p>
  </body>
</html>`

  return { subject, text, html }
}
