/**
 * Single source of truth for invoice number formatting and display.
 *
 * Business format: `"FR 3/04/2026"` (prefix + sequence + month + year).
 * The raw DB id (UUID) must NEVER leak to the UI.
 */

export const DEFAULT_INVOICE_PREFIX = 'FV'
export const INVOICE_NUMBER_PLACEHOLDER = '—'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function sanitizeInvoicePrefix(prefix: string | null | undefined): string {
  const normalized = (prefix ?? '').trim().toUpperCase()
  return normalized || DEFAULT_INVOICE_PREFIX
}

/**
 * Build a business-friendly invoice number.
 *
 * @example
 *   formatInvoiceNumber('FR', 3, new Date(Date.UTC(2026, 3, 11))) // "FR 3/04/2026"
 */
export function formatInvoiceNumber(
  prefix: string,
  sequence: number,
  issueDate: Date,
): string {
  const safePrefix = sanitizeInvoicePrefix(prefix)
  const year = issueDate.getUTCFullYear()
  const month = issueDate.getUTCMonth() + 1
  return `${safePrefix} ${sequence}/${pad2(month)}/${year}`
}

/**
 * Resolve the value to render in the UI.
 *
 * Accepts either a full invoice-like object or just its number field. When the
 * business number is missing (legacy rows) we return a neutral placeholder —
 * never the raw id.
 */
export function displayInvoiceNumber(
  input: { invoice_number?: string | null } | string | null | undefined,
): string {
  const raw = typeof input === 'string' || input == null ? input : input.invoice_number
  const trimmed = (raw ?? '').trim()
  return trimmed.length > 0 ? trimmed : INVOICE_NUMBER_PLACEHOLDER
}

export interface ParsedInvoiceNumber {
  prefix: string
  sequence: number
  month: number
  year: number
}

/**
 * Inverse of {@link formatInvoiceNumber}. Returns `null` for unrecognized
 * shapes so callers can fall back gracefully without throwing.
 */
export function parseInvoiceNumber(value: string | null | undefined): ParsedInvoiceNumber | null {
  if (!value) return null
  const match = value.trim().match(/^([A-Z0-9]+)\s+(\d+)\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, prefix, sequence, month, year] = match
  return {
    prefix,
    sequence: Number(sequence),
    month: Number(month),
    year: Number(year),
  }
}
