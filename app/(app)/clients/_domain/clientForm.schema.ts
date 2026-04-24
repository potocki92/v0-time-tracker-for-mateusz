import { z } from 'zod'

import type { Client, ClientFormData } from '@/lib/types'
import { CLIENT_COLORS } from './clients.constants'
import {
  COUNTRIES,
  CURRENCIES,
  DEFAULT_COUNTRY_CODE,
  LOCALES,
  TIMEZONES,
  findCountry,
  getCountryOrDefault,
  inferCountryFromTaxId,
  type CurrencyCode,
} from './clientForm.i18n'

const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [string, ...string[]]
const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [CurrencyCode, ...CurrencyCode[]]
const LOCALE_CODES = LOCALES.map((l) => l.code) as [string, ...string[]]
const TIMEZONE_CODES = TIMEZONES as readonly string[] as [string, ...string[]]

/**
 * Helper: produce an optional-string schema that normalises empty values
 * to `''` so we don't have to branch between `undefined` and `''` everywhere.
 */
const optionalString = () =>
  z.string().trim().optional().default('').or(z.literal(''))

export const clientFormSchema = z
  .object({
    // ── Dane podstawowe ────────────────────────────────────────────────
    name:         z.string().trim().min(1, 'Podaj nazwę klienta').max(120, 'Maks. 120 znaków'),
    country_code: z.enum(COUNTRY_CODES),

    // ── Identyfikatory podatkowe ───────────────────────────────────────
    nip:    optionalString(),
    regon:  optionalString(),

    // ── Dane kontaktowe ────────────────────────────────────────────────
    email:           z
      .string()
      .trim()
      .email('Podaj poprawny adres email')
      .optional()
      .or(z.literal('')),
    phone_dial_code: z.string().regex(/^\+\d{1,4}$/, 'Nieprawidłowy numer kierunkowy'),
    phone_number:    optionalString(),
    website:         z
      .string()
      .trim()
      .url('Podaj pełny adres URL (np. https://...)')
      .optional()
      .or(z.literal('')),

    // ── Adres ──────────────────────────────────────────────────────────
    address:     optionalString(),
    city:        optionalString(),
    postal_code: optionalString(),
    region:      optionalString(),

    // ── Preferencje komunikacji ────────────────────────────────────────
    locale:   z.enum(LOCALE_CODES).optional(),
    timezone: z.enum(TIMEZONE_CODES).optional(),

    // ── Rozliczenia ────────────────────────────────────────────────────
    work_type: z.enum(['hourly', 'piecework']),
    rate:      z.coerce.number().positive('Stawka musi być większa niż 0'),
    currency:  z.enum(CURRENCY_CODES),
    unit:      optionalString(),

    // ── Automatyzacja i UI ─────────────────────────────────────────────
    is_default:             z.boolean(),
    auto_invoice_enabled:   z.boolean(),
    auto_invoice_frequency: z.enum(['weekly', 'monthly']),
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Kolor musi być w formacie hex')
      .refine((color) => CLIENT_COLORS.some((option) => option === color), 'Wybierz kolor z listy'),
  })
  .superRefine((value, ctx) => {
    const country = getCountryOrDefault(value.country_code)

    // Tax ID — per-country rules. Empty == optional for all countries.
    const taxId = value.nip?.trim()
    if (taxId && country.taxIdRules.length > 0) {
      const matches = country.taxIdRules.some((rule) => rule.test(taxId))
      if (!matches) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['nip'],
          message: `Nieprawidłowy ${country.taxIdLabel} — przykład: ${country.taxIdHint}`,
        })
      }
    }

    // Postal code — only when country specifies a strict format.
    const postal = value.postal_code?.trim()
    if (postal && country.postalCode && !country.postalCode.test(postal)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['postal_code'],
        message: `Nieprawidłowy kod pocztowy — przykład: ${country.postalHint}`,
      })
    }

    // REGON is a Polish-only artefact.
    const regon = value.regon?.trim()
    if (regon && value.country_code === 'PL' && !/^\d{9}$|^\d{14}$/.test(regon)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['regon'],
        message: 'REGON musi mieć 9 lub 14 cyfr',
      })
    }

    // Piecework unit is mandatory.
    if (value.work_type === 'piecework' && !value.unit?.trim()) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        path:    ['unit'],
        message: 'Dla pracy akordowej podaj jednostkę',
      })
    }

    // Phone number sanity: digits, spaces, dashes, parens. 4–15 chars once
    // stripped (ITU-T E.164 caps at 15 digits including dial code).
    const phoneNumber = value.phone_number?.trim()
    if (phoneNumber) {
      const cleaned = phoneNumber.replace(/[\s\-()]/g, '')
      if (!/^\d{4,14}$/.test(cleaned)) {
        ctx.addIssue({
          code:    z.ZodIssueCode.custom,
          path:    ['phone_number'],
          message: 'Numer telefonu powinien zawierać 4–14 cyfr',
        })
      }
    }
  })

export type ClientFormValues = z.infer<typeof clientFormSchema>

const defaultCountry = getCountryOrDefault(DEFAULT_COUNTRY_CODE)

export const EMPTY_CLIENT_FORM_VALUES: ClientFormValues = {
  name:                   '',
  country_code:           defaultCountry.code,
  nip:                    '',
  regon:                  '',
  email:                  '',
  phone_dial_code:        defaultCountry.dialCode,
  phone_number:           '',
  website:                '',
  address:                '',
  city:                   '',
  postal_code:            '',
  region:                 '',
  locale:                 defaultCountry.locale,
  timezone:               defaultCountry.timezone,
  work_type:              'hourly',
  rate:                   0,
  currency:               'PLN',
  unit:                   'kW',
  is_default:             false,
  auto_invoice_enabled:   false,
  auto_invoice_frequency: 'weekly',
  color:                  CLIENT_COLORS[0],
}

function toOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/**
 * Split a persisted E.164-ish phone string back into dial code + local number
 * so we can populate the form in edit mode. Recognises only dial codes we
 * know about — anything else falls back to "leave dial code as country
 * default, stuff the whole string into phone_number".
 */
function splitPhone(phone: string | null | undefined, fallbackDialCode: string) {
  const normalized = phone?.trim()
  if (!normalized) return { dialCode: fallbackDialCode, number: '' }

  if (normalized.startsWith('+')) {
    const match = COUNTRIES
      .map((c) => c.dialCode)
      .sort((a, b) => b.length - a.length) // longest-match first
      .find((code) => normalized.startsWith(code))
    if (match) {
      return { dialCode: match, number: normalized.slice(match.length).trim() }
    }
  }

  return { dialCode: fallbackDialCode, number: normalized }
}

export function toClientFormValues(client: Client): ClientFormValues {
  const countryCode =
    findCountry(client.country_code)?.code
    ?? inferCountryFromTaxId(client.nip)
    ?? DEFAULT_COUNTRY_CODE
  const country = getCountryOrDefault(countryCode)
  const { dialCode, number } = splitPhone(client.phone, country.dialCode)

  return {
    name:                   client.name,
    country_code:           countryCode,
    nip:                    client.nip ?? '',
    regon:                  client.regon ?? '',
    email:                  client.email ?? '',
    phone_dial_code:        dialCode,
    phone_number:           number,
    website:                client.website ?? '',
    address:                client.address ?? '',
    city:                   client.city ?? '',
    postal_code:            client.postal_code ?? '',
    region:                 client.region ?? '',
    locale:                 client.locale ?? country.locale,
    timezone:               client.timezone ?? country.timezone,
    work_type:              client.work_type,
    rate:                   client.rate,
    currency:               client.currency,
    unit:                   client.unit ?? 'kW',
    is_default:             client.is_default,
    auto_invoice_enabled:   Boolean(client.auto_invoice_enabled),
    auto_invoice_frequency: client.auto_invoice_frequency ?? 'weekly',
    color:                  client.color,
  }
}

/**
 * Recombine dial code + local number into a single E.164-ish string for
 * persistence. We keep the space separator so the phone is human-readable
 * when shown in tables.
 */
function joinPhone(dialCode: string, number: string): string | undefined {
  const cleaned = number.replace(/[\s\-()]/g, '').trim()
  if (!cleaned) return undefined
  return `${dialCode} ${cleaned}`
}

export function toClientMutationInput(values: ClientFormValues): ClientFormData {
  return {
    name:                   values.name.trim(),
    nip:                    toOptional(values.nip),
    regon:                  toOptional(values.regon),
    email:                  toOptional(values.email),
    phone:                  joinPhone(values.phone_dial_code, values.phone_number ?? ''),
    website:                toOptional(values.website),
    address:                toOptional(values.address),
    city:                   toOptional(values.city),
    postal_code:            toOptional(values.postal_code),
    region:                 toOptional(values.region),
    country_code:           values.country_code,
    locale:                 values.locale,
    timezone:               values.timezone,
    work_type:              values.work_type,
    rate:                   values.rate,
    currency:               values.currency,
    unit:                   toOptional(values.unit),
    is_default:             values.is_default,
    auto_invoice_enabled:   values.auto_invoice_enabled,
    auto_invoice_frequency: values.auto_invoice_frequency,
    color:                  values.color,
  }
}
