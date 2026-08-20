import { z } from 'zod'

/**
 * User-level invoice settings. Stored inside auth.users.user_metadata.invoice_settings
 * and returned by supabase.auth.getUser(). Always `safeParse` from unknown — never cast.
 */

const INVOICE_TEMPLATE_KEYS = ['classic', 'modern', 'minimal'] as const
const RESET_SEQUENCE_VALUES = ['yearly', 'monthly'] as const

export const invoiceSettingsSchema = z.object({
  userPrefix: z.string().trim().min(1).max(10).default('FV'),
  numberingPattern: z.string().trim().max(80).default('FV/{SERIA}/{YYYY}/{MM}/{SEQ}'),
  series: z.string().trim().max(10).default('A'),
  branch: z.string().trim().max(10).default('HQ'),
  resetSequence: z.enum(RESET_SEQUENCE_VALUES).default('monthly'),
  defaultTemplate: z.enum(INVOICE_TEMPLATE_KEYS).default('classic'),
  templateAccentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/i, 'Invalid hex color')
    .default('#1d4ed8'),
  templateFooter: z.string().max(500).default('Dziękujemy za współpracę.'),
  autoIssueEnabled: z.boolean().default(false),
  dueDays: z.coerce.number().int().min(0).max(365).default(7),
})

export type InvoiceSettingsInput = z.infer<typeof invoiceSettingsSchema>

const userMetadataInvoiceSchema = z
  .object({
    invoice_settings: invoiceSettingsSchema.partial().optional(),
  })
  .passthrough()

/**
 * Safely resolve invoice settings from raw user metadata. Never throws.
 * Falls back to schema defaults and reports via the optional onWarn callback so
 * callers can forward the issue to Sentry (server) or console (client).
 */
export function resolveInvoiceSettings(
  raw: unknown,
  onWarn?: (issues: unknown) => void,
): InvoiceSettingsInput {
  const metaParsed = userMetadataInvoiceSchema.safeParse(raw ?? {})
  if (!metaParsed.success) {
    if (onWarn) onWarn(metaParsed.error.issues)
    return invoiceSettingsSchema.parse({})
  }

  const candidate = metaParsed.data.invoice_settings ?? {}
  const parsed = invoiceSettingsSchema.safeParse(candidate)
  if (parsed.success) return parsed.data

  if (onWarn) onWarn(parsed.error.issues)
  return invoiceSettingsSchema.parse({})
}
