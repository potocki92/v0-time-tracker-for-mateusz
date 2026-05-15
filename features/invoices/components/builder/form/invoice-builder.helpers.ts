/**
 * Pure helpers for the Invoice Builder form.
 *
 * Kept separate from the React tree so they can be unit-tested in isolation
 * and reused by server actions / PDF rendering. No DOM, no RHF imports.
 */

import {
  INVOICE_BUILDER_CURRENCIES,
  type InvoiceBuilderCurrency,
  type InvoiceBuilderValues,
  type LineItemInput,
} from '@/lib/schemas/invoice-builder.schema'

/**
 * Generates a stable, collision-resistant client-side id for a line item.
 * Used as `dnd-kit`'s sortable id and React's key — never persisted, the
 * server assigns the canonical primary key on save.
 */
export function makeLineItemId(): string {
  // crypto.randomUUID is available in modern browsers and Node 19+. Fall
  // back to a Math.random-based id when running in older test runners.
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID()
  }
  return `li_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

/** Today as YYYY-MM-DD in the user's local timezone. */
export function todayIso(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Add `days` to an ISO date and return the resulting ISO date. */
export function addDaysIso(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  const yyyy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function emptyLineItem(): LineItemInput {
  return {
    id: makeLineItemId(),
    description: '',
    unit: 'szt.',
    quantity: 1,
    unit_price_net: 0,
    vat_mode: 'standard',
    vat_rate: 23,
  }
}

export interface InvoiceBuilderDefaults {
  /** Override invoice number (e.g. next number from sequence). */
  invoiceNumber?: string
  /** Default payment due offset in days (issue_date + N). Default 14. */
  dueDays?: number
  /** Currency to start with. Default PLN. */
  currency?: InvoiceBuilderCurrency
  /** Pre-seed the buyer block from a known counterparty. */
  buyer?: Partial<InvoiceBuilderValues['buyer']>
}

const TAX_ID_COUNTRY_PATTERNS: ReadonlyArray<{
  code: string
  patterns: ReadonlyArray<RegExp>
}> = [
  { code: 'PL', patterns: [/^\d{10}$/, /^PL\d{10}$/i] },
  { code: 'DE', patterns: [/^DE\d{9}$/i, /^\d{2}\/\d{3}\/\d{5}$/] },
  { code: 'GB', patterns: [/^GB\d{9}$/i, /^GB\d{12}$/i] },
  { code: 'FR', patterns: [/^FR[A-HJ-NP-Z0-9]{2}\d{9}$/i] },
  { code: 'NL', patterns: [/^NL\d{9}B\d{2}$/i] },
  { code: 'CZ', patterns: [/^CZ\d{8,10}$/i] },
  { code: 'SE', patterns: [/^SE\d{12}$/i] },
  { code: 'CH', patterns: [/^CHE-\d{3}\.\d{3}\.\d{3}( (MWST|TVA|IVA))?$/i] },
]

export function inferCountryCodeFromTaxId(taxId: string | null | undefined): string | null {
  const normalized = taxId?.trim()
  if (!normalized) return null

  const match = TAX_ID_COUNTRY_PATTERNS.find((country) =>
    country.patterns.some((pattern) => pattern.test(normalized)),
  )
  return match?.code ?? null
}

export function resolveBuyerCountryCode(
  countryCode: string | null | undefined,
  taxId: string | null | undefined,
): string {
  const normalized = countryCode?.trim().toUpperCase()
  return normalized || inferCountryCodeFromTaxId(taxId) || 'PL'
}

/**
 * Builds the empty/blank values used to seed the form for a new invoice.
 * Edit mode should produce its values from existing persisted data and
 * pass them as `initialValues` to the dialog.
 */
export function createDefaultInvoiceBuilderValues(
  defaults: InvoiceBuilderDefaults = {},
): InvoiceBuilderValues {
  const today = todayIso()
  const due = addDaysIso(today, defaults.dueDays ?? 14)
  const currency = defaults.currency ?? 'PLN'

  return {
    invoice_number: defaults.invoiceNumber ?? '',
    issue_date: today,
    sale_date: today,
    due_date: due,
    currency,
    exchange_rate: undefined,
    exchange_rate_date: undefined,
    language: 'pl',
    buyer: {
      name:         defaults.buyer?.name ?? '',
      tax_id:       defaults.buyer?.tax_id ?? '',
      country_code: resolveBuyerCountryCode(
        defaults.buyer?.country_code,
        defaults.buyer?.tax_id,
      ),
      address:      defaults.buyer?.address ?? '',
      city:         defaults.buyer?.city ?? '',
      postal_code:  defaults.buyer?.postal_code ?? '',
      email:        defaults.buyer?.email ?? '',
      is_vat_eu:    defaults.buyer?.is_vat_eu ?? false,
    },
    items: [emptyLineItem()],
    payment: {
      method:       'bank_transfer',
      bank_account: '',
      bank_name:    '',
      swift:        '',
    },
    notes: '',
  }
}

/** Whether the chosen currency requires an FX rate to PLN for accounting. */
export function isForeignCurrency(currency: InvoiceBuilderCurrency): boolean {
  return currency !== 'PLN'
}

/** Type guard for runtime currency strings (e.g. from URL/query). */
export function isInvoiceBuilderCurrency(value: unknown): value is InvoiceBuilderCurrency {
  return (
    typeof value === 'string' &&
    (INVOICE_BUILDER_CURRENCIES as readonly string[]).includes(value)
  )
}
