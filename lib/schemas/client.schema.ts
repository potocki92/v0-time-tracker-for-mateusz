import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa wymagana'),
  nip:  z.string().trim().optional().or(z.literal('')),
  email: z.string().email('Niepoprawny email').optional().or(z.literal('')),
  work_type: z.enum(['hourly', 'piecework']),
  rate:      z.coerce.number().positive('Stawka musi być dodatnia'),
  currency:  z.enum(['PLN', 'EUR']),
  unit:      z.string().optional(),
  is_default: z.boolean().default(false),
  color:     z.string().regex(/^#[0-9a-f]{6}$/i, 'Kolor musi być w formacie hex'),
})

export type ClientInput = z.infer<typeof clientSchema>
