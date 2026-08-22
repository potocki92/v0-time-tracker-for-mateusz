import { z } from 'zod'

/** Ten sam wzorzec, co CHECK w migracji `weekly_summary_email`. */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const recipientEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, 'Adres może mieć maks. 120 znaków')
  // Puste pole jest legalne dopóki automat jest wylaczony — inaczej nie da sie
  // zapisac formularza przed wpisaniem adresu.
  .refine((value) => value === '' || EMAIL_PATTERN.test(value), 'Podaj poprawny adres e-mail')

export const weeklySummaryEmailSchema = z
  .object({
    enabled: z.boolean(),
    recipientEmail,
  })
  .refine((values) => !values.enabled || values.recipientEmail !== '', {
    message: 'Podaj adres e-mail odbiorcy',
    path: ['recipientEmail'],
  })

export type WeeklySummaryEmailSettings = z.infer<typeof weeklySummaryEmailSchema>
