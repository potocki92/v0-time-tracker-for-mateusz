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

/**
 * Skóra statusu — tokeny akcentów panelu (`app/globals.css`), nie paleta
 * Tailwinda. Badge stoi na shadcnowej karcie, więc jest świadomy schematu:
 * wypełnienie i kontur biorą krycie z jednego stopnia, a tekst przeskakuje
 * z 700 (na jasnym) na 300 (na ciemnym).
 */
export const INVOICE_STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'bg-muted text-muted-foreground border-border',
  [InvoiceStatus.SENT]:
    'bg-info-500/10 text-info-700 border-info-500/30 dark:text-info-300',
  [InvoiceStatus.PAID]:
    'bg-positive-500/10 text-positive-700 border-positive-500/30 dark:text-positive-300',
  [InvoiceStatus.OVERDUE]:
    'bg-danger-500/10 text-danger-700 border-danger-500/30 dark:text-danger-300',
  [InvoiceStatus.CANCELLED]:
    'bg-muted text-muted-foreground border-border line-through',
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
