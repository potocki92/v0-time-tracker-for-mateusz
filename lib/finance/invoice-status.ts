/**
 * Invoice lifecycle status. Mirrors the `invoice_status` enum in PostgreSQL
 * (see migracja invoice_status_enum w supabase/migrations).
 */
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus]

export const INVOICE_STATUS_VALUES = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
  InvoiceStatus.CANCELLED,
] as const

export const INVOICE_STATUS_LABELS_PL: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Szkic',
  [InvoiceStatus.SENT]: 'Wystawiona',
  [InvoiceStatus.PAID]: 'Opłacona',
  [InvoiceStatus.OVERDUE]: 'Zaległa',
  [InvoiceStatus.CANCELLED]: 'Anulowana',
}

/** Tailwind color tokens per status — consumed by badges and cards. */
export const INVOICE_STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200',
  [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-700 border-blue-200',
  [InvoiceStatus.PAID]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [InvoiceStatus.OVERDUE]: 'bg-red-100 text-red-700 border-red-200',
  [InvoiceStatus.CANCELLED]: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
}

export interface StatusDerivationInput {
  status?: InvoiceStatus | string | null
  is_paid?: boolean | null
  due_date?: string | null
  invoice_number?: string | null
  paid_date?: string | null
}

function isKnownStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && (INVOICE_STATUS_VALUES as readonly string[]).includes(value)
}

function isPastDate(isoDate: string, today: Date): boolean {
  // Compare as strings when possible (ISO format is lexicographic).
  const todayIso = today.toISOString().slice(0, 10)
  return isoDate < todayIso
}

/**
 * Derive the current status for an invoice. Uses the persisted `status` column
 * when available; otherwise reconstructs it from legacy fields for backwards
 * compatibility with rows that have not been migrated yet.
 *
 * Callers can pass a `now` for deterministic testing.
 */
export function deriveInvoiceStatus(
  invoice: StatusDerivationInput,
  now: Date = new Date(),
): InvoiceStatus {
  if (isKnownStatus(invoice.status)) {
    // Upgrade SENT to OVERDUE at the read layer even if the cron has not run yet.
    if (
      invoice.status === InvoiceStatus.SENT &&
      invoice.due_date &&
      isPastDate(invoice.due_date, now)
    ) {
      return InvoiceStatus.OVERDUE
    }
    return invoice.status
  }

  if (invoice.is_paid === true) return InvoiceStatus.PAID
  if (invoice.due_date && isPastDate(invoice.due_date, now)) return InvoiceStatus.OVERDUE
  if (!invoice.invoice_number) return InvoiceStatus.DRAFT
  return InvoiceStatus.SENT
}

export function isUnpaidStatus(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.SENT || status === InvoiceStatus.OVERDUE || status === InvoiceStatus.DRAFT
}

export function isTerminalStatus(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED
}
