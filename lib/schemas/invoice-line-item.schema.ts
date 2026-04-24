import { z } from 'zod'

/**
 * VAT rates available in Poland. 'zw' and 'np' are not numeric rates but are
 * allowed on PL invoices — consumers handle them separately and always persist
 * a numeric vat_rate of 0 for those lines.
 */
export const PL_VAT_RATES = [0, 5, 8, 23] as const
export type PlVatRate = (typeof PL_VAT_RATES)[number]

export const invoiceLineItemSchema = z.object({
  position: z.coerce.number().int().min(1).optional(),
  description: z.string().trim().min(1, 'Opis pozycji jest wymagany').max(500),
  unit: z.string().trim().max(20).default('szt.'),
  quantity: z.coerce
    .number()
    .positive('Ilość musi być większa od zera')
    .max(999_999_999),
  unit_price_net: z.coerce
    .number()
    .min(0, 'Cena nie może być ujemna')
    .max(99_999_999.99),
  vat_rate: z.coerce.number().min(0).max(100).default(23),
})

export const invoiceLineItemsSchema = z
  .array(invoiceLineItemSchema)
  .min(1, 'Faktura musi zawierać przynajmniej jedną pozycję')
  .max(200, 'Za dużo pozycji na jednej fakturze')

export type InvoiceLineItemInputSchema = z.infer<typeof invoiceLineItemSchema>
