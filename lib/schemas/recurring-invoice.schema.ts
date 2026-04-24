import { z } from 'zod'
import { invoiceLineItemSchema } from './invoice-line-item.schema'
import { RECURRING_FREQUENCIES } from '@/lib/finance/recurring-schedule'

export const recurringInvoiceSchema = z
  .object({
    client_id: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional(),
    currency: z.enum(['PLN', 'EUR']).default('PLN'),
    template_key: z.enum(['classic', 'modern', 'minimal']).default('classic'),
    template_accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/i).optional(),
    template_footer: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    frequency: z.enum(RECURRING_FREQUENCIES),
    due_days: z.coerce.number().int().min(0).max(365).default(14),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    next_issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    is_active: z.boolean().default(true),
    line_items: z.array(invoiceLineItemSchema).min(1).max(200),
  })
  .refine((data) => !data.end_date || data.end_date >= data.start_date, {
    path: ['end_date'],
    message: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
  })

export type RecurringInvoiceInput = z.infer<typeof recurringInvoiceSchema>
