/**
 * Bridges between the legacy invoice types (`Invoice`, `InvoiceFormValues`)
 * and the redesigned builder schema (`InvoiceBuilderValues`).
 *
 * Kept thin and pure on purpose:
 *   - `invoiceToBuilderValues`     — best-effort hydration for edit mode.
 *   - `builderValuesToFormValues`  — flattens the builder's rich shape into
 *                                    the columns the legacy save flow knows
 *                                    how to persist today.
 *
 * The legacy schema doesn't model line items, buyer details, FX rate or
 * payment metadata, so the builder→form direction is intentionally lossy.
 * Once the persistence layer learns the new columns this file collapses
 * into a one-line passthrough — until then, it's the seam that lets us
 * roll out the new UX without a database migration.
 */

import type { CURRENCY, Invoice } from '@/lib/types'
import type {
  InvoiceBuilderCurrency,
  InvoiceBuilderValues,
  LineItemInput,
} from '@/lib/schemas/invoice-builder.schema'
import type {
  BillingQuarter,
  InvoiceFormValues,
  InvoiceSettings,
  InvoiceTemplateKey,
} from '../../../domain'

import {
  addDaysIso,
  emptyLineItem,
  isInvoiceBuilderCurrency,
  todayIso,
} from './invoice-builder.helpers'

/** Currencies the legacy persistence layer accepts today. */
const LEGACY_CURRENCIES: ReadonlySet<CURRENCY> = new Set(['PLN', 'EUR'])

function clampToLegacyCurrency(currency: InvoiceBuilderCurrency): CURRENCY {
  return LEGACY_CURRENCIES.has(currency as CURRENCY) ? (currency as CURRENCY) : 'PLN'
}

function pickBuilderCurrency(value: unknown): InvoiceBuilderCurrency {
  return isInvoiceBuilderCurrency(value) ? value : 'PLN'
}

function quarterFromIso(iso: string | null | undefined): BillingQuarter {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Q1'
  const month = Number(iso.slice(5, 7))
  if (month <= 3)  return 'Q1'
  if (month <= 6)  return 'Q2'
  if (month <= 9)  return 'Q3'
  return 'Q4'
}

function yearFromIso(iso: string | null | undefined): number {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date().getFullYear()
  return Number(iso.slice(0, 4))
}

/** Sum of gross amounts across a builder's line items, in major units. */
function sumGross(items: ReadonlyArray<LineItemInput>): number {
  return items.reduce<number>((acc, item) => {
    const qty   = Number(item.quantity) || 0
    const price = Number(item.unit_price_net) || 0
    const rate  = item.vat_mode === 'standard' ? (Number(item.vat_rate) || 0) : 0
    return acc + qty * price * (1 + rate / 100)
  }, 0)
}

/**
 * Hydrate a legacy `Invoice` into the rich builder shape so the user can
 * keep editing without losing context. Missing columns fall back to safe
 * defaults — a single line item carrying the legacy `amount` keeps totals
 * visible while the buyer/payment blocks come up empty for the user to fill.
 */
export function invoiceToBuilderValues(invoice: Invoice): InvoiceBuilderValues {
  const issueDate = invoice.invoice_date ?? invoice.issue_date ?? todayIso()
  const dueDate   = invoice.due_date ?? addDaysIso(issueDate, 14)

  return {
    invoice_number: invoice.invoice_number ?? '',
    issue_date:     issueDate,
    sale_date:      issueDate,
    due_date:       dueDate,
    currency:       pickBuilderCurrency(invoice.currency),
    exchange_rate:      undefined,
    exchange_rate_date: undefined,
    language: 'pl',
    buyer: {
      name:         invoice.recipient ?? '',
      tax_id:       '',
      country_code: 'PL',
      address:      '',
      city:         '',
      postal_code:  '',
      email:        '',
      is_vat_eu:    false,
    },
    items: [
      {
        ...emptyLineItem(),
        description:    invoice.description ?? invoice.name ?? 'Pozycja faktury',
        unit:           'szt.',
        quantity:       1,
        unit_price_net: Number(invoice.net_amount ?? invoice.amount ?? 0),
        vat_mode:       'standard',
        vat_rate:       23,
      },
    ],
    payment: {
      method:       'bank_transfer',
      bank_account: '',
      bank_name:    '',
      swift:        '',
    },
    notes: invoice.notes ?? invoice.note ?? '',
  }
}

interface BuilderToFormOptions {
  /** Existing client to attach the invoice to (edit mode). */
  clientId?: string | null
  /** Source of truth for the default invoice template. */
  settings:  InvoiceSettings
  /** Carry over the legacy "paid" flag when editing. */
  isPaid?:   boolean
  /** Override the template the legacy save flow uses. */
  templateKey?: InvoiceTemplateKey
}

/**
 * Flatten the builder's shape into the columns the legacy `saveInvoice`
 * action knows how to persist. Lossy by design — see file header.
 */
export function builderValuesToFormValues(
  values: InvoiceBuilderValues,
  options: BuilderToFormOptions,
): InvoiceFormValues {
  const buyerName = values.buyer.name.trim()
  const grossTotal = sumGross(values.items)
  const billingYear = yearFromIso(values.issue_date)
  const billingQuarter = quarterFromIso(values.issue_date)

  return {
    // The legacy `name` doubles as the human-readable label in the list.
    name:            buyerName ? `${values.invoice_number} — ${buyerName}` : values.invoice_number,
    invoice_number:  values.invoice_number,
    recipient:       buyerName,
    billing_period:  `${billingQuarter} ${billingYear}`,
    billing_quarter: billingQuarter,
    billing_year:    billingYear,
    invoice_date:    values.issue_date,
    amount:          Number(grossTotal.toFixed(2)),
    currency:        clampToLegacyCurrency(values.currency),
    is_paid:         options.isPaid ?? false,
    notes:           values.notes ?? '',
    template_key:    options.templateKey ?? options.settings.defaultTemplate,
    file:            null,
    client_id:       options.clientId ?? null,
    new_client_name: options.clientId ? '' : buyerName,
  }
}
