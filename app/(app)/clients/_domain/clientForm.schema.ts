import { z } from 'zod'

import type { Client, ClientFormData } from '@/lib/types'
import { CLIENT_COLORS } from './clients.constants'

export const clientFormSchema = z
  .object({
    name:       z.string().trim().min(1, 'Podaj nazwę klienta'),
    nip:        z.string().trim().regex(/^\d{10}$/, 'NIP musi mieć 10 cyfr').optional().or(z.literal('')),
    regon:      z.string().trim().regex(/^\d{9}$/, 'REGON musi mieć 9 cyfr').optional().or(z.literal('')),
    email:      z.string().trim().email('Podaj poprawny adres email').optional().or(z.literal('')),
    phone:      z.string().trim().optional().or(z.literal('')),
    work_type:  z.enum(['hourly', 'piecework']),
    rate:       z.coerce.number().positive('Stawka musi być większa niż 0'),
    currency:   z.enum(['PLN', 'EUR']),
    unit:       z.string().trim().optional().or(z.literal('')),
    is_default: z.boolean(),
    color:      z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Kolor musi być w formacie hex')
      .refine((color) => CLIENT_COLORS.some((option) => option === color), 'Wybierz kolor z listy'),
  })
  .superRefine((value, ctx) => {
    if (value.work_type === 'piecework' && !value.unit?.trim()) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['unit'],
        message: 'Dla pracy akordowej podaj jednostkę',
      })
    }
  })

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const EMPTY_CLIENT_FORM_VALUES: ClientFormValues = {
  name:       '',
  nip:        '',
  regon:      '',
  email:      '',
  phone:      '',
  work_type:  'hourly',
  rate:       0,
  currency:   'PLN',
  unit:       'kW',
  is_default: false,
  color:      CLIENT_COLORS[0],
}

function toOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export function toClientFormValues(client: Client): ClientFormValues {
  return {
    name:       client.name,
    nip:        client.nip ?? '',
    regon:      client.regon ?? '',
    email:      client.email ?? '',
    phone:      client.phone ?? '',
    work_type:  client.work_type,
    rate:       client.rate,
    currency:   client.currency,
    unit:       client.unit ?? 'kW',
    is_default: client.is_default,
    color:      client.color,
  }
}

export function toClientMutationInput(values: ClientFormValues): ClientFormData {
  return {
    name:       values.name.trim(),
    nip:        toOptional(values.nip),
    regon:      toOptional(values.regon),
    email:      toOptional(values.email),
    phone:      toOptional(values.phone),
    work_type:  values.work_type,
    rate:       values.rate,
    currency:   values.currency,
    unit:       toOptional(values.unit),
    is_default: values.is_default,
    color:      values.color,
  }
}
