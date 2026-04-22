import { z } from 'zod'

import type { Client, ClientFormData } from '@/lib/types'
import { CLIENT_COLORS } from './clients.constants'

export const clientFormSchema = z
  .object({
    name:       z.string().trim().min(1, 'Podaj nazwę klienta'),
    nip:        z.string().trim().optional().or(z.literal('')),
    is_foreign_client: z.boolean(),
    regon:      z.string().trim().regex(/^\d{9}$/, 'REGON musi mieć 9 cyfr').optional().or(z.literal('')),
    email:      z.string().trim().email('Podaj poprawny adres email').optional().or(z.literal('')),
    phone:      z.string().trim().optional().or(z.literal('')),
    work_type:  z.enum(['hourly', 'piecework']),
    rate:       z.coerce.number().positive('Stawka musi być większa niż 0'),
    currency:   z.enum(['PLN', 'EUR']),
    unit:       z.string().trim().optional().or(z.literal('')),
    is_default: z.boolean(),
    auto_invoice_enabled: z.boolean(),
    auto_invoice_frequency: z.enum(['weekly', 'monthly']),
    color:      z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Kolor musi być w formacie hex')
      .refine((color) => CLIENT_COLORS.some((option) => option === color), 'Wybierz kolor z listy'),
  })
  .superRefine((value, ctx) => {
    const normalizedTaxId = value.nip?.trim() ?? ''

    if (value.is_foreign_client) {
      const isValidForeignTaxId = normalizedTaxId.length === 0 || /^[A-Za-z0-9./\-]{3,20}$/.test(normalizedTaxId)
      if (!isValidForeignTaxId) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['nip'],
          message: 'Dla klienta zagranicznego podaj STR./Tax ID (3-20 znaków: litery, cyfry, ./-)',
        })
      }
    } else if (normalizedTaxId.length > 0 && !/^\d{10}$/.test(normalizedTaxId)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['nip'],
        message: 'NIP musi mieć 10 cyfr',
      })
    }

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
  is_foreign_client: false,
  regon:      '',
  email:      '',
  phone:      '',
  work_type:  'hourly',
  rate:       0,
  currency:   'PLN',
  unit:       'kW',
  is_default: false,
  auto_invoice_enabled: false,
  auto_invoice_frequency: 'weekly',
  color:      CLIENT_COLORS[0],
}

function toOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function isForeignTaxId(value: string | null | undefined): boolean {
  if (!value) return false
  return !/^\d{10}$/.test(value.trim())
}

export function toClientFormValues(client: Client): ClientFormValues {
  return {
    name:       client.name,
    nip:        client.nip ?? '',
    is_foreign_client: isForeignTaxId(client.nip),
    regon:      client.regon ?? '',
    email:      client.email ?? '',
    phone:      client.phone ?? '',
    work_type:  client.work_type,
    rate:       client.rate,
    currency:   client.currency,
    unit:       client.unit ?? 'kW',
    is_default: client.is_default,
    auto_invoice_enabled: Boolean(client.auto_invoice_enabled),
    auto_invoice_frequency: client.auto_invoice_frequency ?? 'weekly',
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
    auto_invoice_enabled: values.auto_invoice_enabled,
    auto_invoice_frequency: values.auto_invoice_frequency,
    color:      values.color,
  }
}
