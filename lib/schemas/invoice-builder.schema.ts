import { z } from 'zod'

/**
 * Superset schema used by the redesigned Invoice Builder.
 *
 * Intentionally kept independent from the legacy `invoice.schema.ts` so the
 * existing `InvoiceFormDialog` flow keeps working while the new builder is
 * rolled out. A future migration can fold the two together once the DB
 * columns for counterparty, FX rate and payment method are persisted.
 */

export const INVOICE_BUILDER_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'] as const
export type InvoiceBuilderCurrency = (typeof INVOICE_BUILDER_CURRENCIES)[number]

export const INVOICE_LANGUAGES = ['pl', 'en', 'pl_en'] as const
export type InvoiceLanguage = (typeof INVOICE_LANGUAGES)[number]

export const PAYMENT_METHODS = ['bank_transfer', 'card', 'cash', 'online'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/**
 * VAT mode covers Polish rates, the two PL-specific non-rates (zw, np), and
 * foreign reverse-charge (rc). `standard` carries a numeric `vat_rate`, every
 * other mode forces a zero VAT amount in totals and a badge on the invoice.
 */
export const VAT_MODES = ['standard', 'zw', 'np', 'rc'] as const
export type VatMode = (typeof VAT_MODES)[number]

/** ISO-8601 date (YYYY-MM-DD) — the HTML date input native format. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Niepoprawna data (YYYY-MM-DD)')

/**
 * VAT IDs vary dramatically across jurisdictions. We enforce a coarse shape
 * here (letters/digits/space/dash/slash/dot only, 4-30 chars) and leave country-specific
 * checksum validation to a future library (`vat-number-validator`, etc).
 */
const taxId = z
  .string()
  .trim()
  .regex(/^[A-Z0-9 ./-]{4,30}$/i, 'Niepoprawny NIP / VAT ID')

const counterpartySchema = z.object({
  name: z.string().trim().min(1, 'Nazwa nabywcy jest wymagana').max(200),
  tax_id: taxId.optional().or(z.literal('')),
  country_code: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/i, 'Kod kraju musi być 2-literowy (ISO 3166)')
    .default('PL'),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  postal_code: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('Niepoprawny e-mail').optional().or(z.literal('')),
  is_vat_eu: z.boolean().default(false),
})
export const lineItemSchema = z
  .object({
    /** Stable client-side id used by dnd-kit & React keys. Not persisted. */
    id: z.string().min(1),
    description: z.string().trim().min(1, 'Opis pozycji jest wymagany').max(500),
    unit: z.string().trim().min(1).max(20).default('szt.'),
    quantity: z.coerce
      .number()
      .positive('Ilość musi być większa od zera')
      .max(999_999_999),
    unit_price_net: z.coerce
      .number()
      .min(0, 'Cena nie może być ujemna')
      .max(99_999_999.99),
    vat_mode: z.enum(VAT_MODES).default('standard'),
    /** Only meaningful when vat_mode === 'standard'. 0-100, no upper-bound magic. */
    vat_rate: z.coerce.number().min(0).max(100).default(23),
  })
  .superRefine((line, ctx) => {
    if (line.vat_mode === 'standard' && !Number.isFinite(line.vat_rate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vat_rate'],
        message: 'Podaj stawkę VAT',
      })
    }
  })
export type LineItemInput = z.infer<typeof lineItemSchema>

const paymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS).default('bank_transfer'),
  /** IBAN or local account number. Spaces allowed for readability. */
  bank_account: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Z0-9 ]*$/i, 'Numer konta może zawierać tylko cyfry, litery i spacje')
    .optional()
    .or(z.literal('')),
  bank_name: z.string().trim().max(100).optional().or(z.literal('')),
  swift: z
    .string()
    .trim()
    .regex(/^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$/i, 'Niepoprawny kod SWIFT/BIC')
    .optional()
    .or(z.literal('')),
})
export const invoiceBuilderSchema = z
  .object({
    invoice_number: z.string().trim().min(1, 'Numer faktury jest wymagany').max(50),
    /** Date the invoice is issued. */
    issue_date: isoDate,
    /** Date of sale / supply. Defaults to issue_date on the client. */
    sale_date: isoDate,
    /** Payment due date. */
    due_date: isoDate,

    currency: z.enum(INVOICE_BUILDER_CURRENCIES),
    /**
     * FX rate to the accounting currency (PLN). Optional; when omitted and
     * currency !== PLN, the summary simply won't show a PLN equivalent.
     */
    exchange_rate: z.coerce.number().positive('Kurs musi być dodatni').optional(),
    exchange_rate_date: isoDate.optional(),

    language: z.enum(INVOICE_LANGUAGES).default('pl'),

    buyer: counterpartySchema,
    items: z
      .array(lineItemSchema)
      .min(1, 'Faktura musi zawierać przynajmniej jedną pozycję')
      .max(200, 'Za dużo pozycji na jednej fakturze'),

    payment: paymentSchema,

    notes: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.due_date < data.issue_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
      })
    }
    if (data.sale_date > data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sale_date'],
        message: 'Data sprzedaży nie może być późniejsza niż termin płatności',
      })
    }
    if (data.currency !== 'PLN' && data.exchange_rate !== undefined && data.exchange_rate <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['exchange_rate'],
        message: 'Kurs musi być dodatni',
      })
    }
  })

export type InvoiceBuilderValues = z.infer<typeof invoiceBuilderSchema>
