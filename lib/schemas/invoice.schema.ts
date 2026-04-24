import { z } from 'zod'
import { INVOICE_STATUS_VALUES } from '@/lib/finance/invoice-status'

export const invoiceSchema = z
  .object({
    client_id: z.string().uuid().optional(),
    name: z.string().min(1, 'Nazwa wymagana').max(200),
    invoice_number: z.string().max(50).optional(),
    invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Niepoprawna data'),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    amount: z.coerce.number().positive('Kwota musi być dodatnia'),
    currency: z.enum(['PLN', 'EUR']),
    status: z.enum(INVOICE_STATUS_VALUES).optional(),
    is_paid: z.boolean().default(false),
    description: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => !data.due_date || data.due_date >= data.invoice_date,
    {
      path: ['due_date'],
      message: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
    },
  )

export type InvoiceInput = z.infer<typeof invoiceSchema>
