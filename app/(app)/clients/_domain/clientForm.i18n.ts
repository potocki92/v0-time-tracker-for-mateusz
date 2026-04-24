/**
 * i18n metadata for the Client form.
 *
 * Kept flat and serialisable so it can be safely imported by server and
 * client components without pulling in any runtime dependency. Extend the
 * COUNTRIES list when onboarding a new market.
 */

/**
 * Billing currency. Intentionally narrow — the invoice + earnings pipeline
 * (see `lib/finance/*`) currently only settles PLN/EUR. Expanding this requires
 * a coordinated backend change (exchange rates, reports, totals).
 */
export type CurrencyCode = 'PLN' | 'EUR'

export interface CountryMeta {
  /** ISO-3166-1 alpha-2 code — used as primary country identifier. */
  code:        string
  name:        string
  flag:        string
  /** E.164 dial code (with leading `+`). */
  dialCode:    string
  /** Default currency — can be overridden per client. */
  currency:    CurrencyCode
  /** BCP-47 locale hint for communication language. */
  locale:      string
  /** IANA timezone — sensible default for the country's main business hub. */
  timezone:    string
  /** Regex validating the postal-code format. `null` = no strict format. */
  postalCode:  RegExp | null
  /** Human-readable hint for the postal-code input. */
  postalHint:  string
  /** Local name for the tax identifier (NIP, VAT ID, USt-IdNr, etc.). */
  taxIdLabel:  string
  /** Regex(es) that validate the tax ID. Matches any = valid. */
  taxIdRules:  ReadonlyArray<RegExp>
  /** Placeholder / example for the tax ID input. */
  taxIdHint:   string
}

/**
 * Curated list of countries. Intentionally not exhaustive — add entries as
 * the business expands. Flags are emoji (no asset dependency).
 */
export const COUNTRIES: readonly CountryMeta[] = [
  {
    code:       'PL',
    name:       'Polska',
    flag:       '🇵🇱',
    dialCode:   '+48',
    currency:   'PLN',
    locale:     'pl-PL',
    timezone:   'Europe/Warsaw',
    postalCode: /^\d{2}-\d{3}$/,
    postalHint: '00-000',
    taxIdLabel: 'NIP',
    taxIdRules: [/^\d{10}$/, /^PL\d{10}$/i],
    taxIdHint:  '1234567890',
  },
  {
    code:       'DE',
    name:       'Niemcy',
    flag:       '🇩🇪',
    dialCode:   '+49',
    currency:   'EUR',
    locale:     'de-DE',
    timezone:   'Europe/Berlin',
    postalCode: /^\d{5}$/,
    postalHint: '10115',
    taxIdLabel: 'USt-IdNr / St.-Nr.',
    taxIdRules: [/^DE\d{9}$/i, /^\d{2}\/\d{3}\/\d{5}$/],
    taxIdHint:  'DE123456789 lub 22/287/20628',
  },
  {
    code:       'GB',
    name:       'Wielka Brytania',
    flag:       '🇬🇧',
    dialCode:   '+44',
    currency:   'EUR',
    locale:     'en-GB',
    timezone:   'Europe/London',
    postalCode: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    postalHint: 'SW1A 1AA',
    taxIdLabel: 'VAT Number',
    taxIdRules: [/^GB\d{9}$/i, /^GB\d{12}$/i],
    taxIdHint:  'GB123456789',
  },
  {
    code:       'US',
    name:       'Stany Zjednoczone',
    flag:       '🇺🇸',
    dialCode:   '+1',
    currency:   'EUR',
    locale:     'en-US',
    timezone:   'America/New_York',
    postalCode: /^\d{5}(-\d{4})?$/,
    postalHint: '10001 lub 10001-1234',
    taxIdLabel: 'EIN',
    taxIdRules: [/^\d{2}-\d{7}$/],
    taxIdHint:  '12-3456789',
  },
  {
    code:       'FR',
    name:       'Francja',
    flag:       '🇫🇷',
    dialCode:   '+33',
    currency:   'EUR',
    locale:     'fr-FR',
    timezone:   'Europe/Paris',
    postalCode: /^\d{5}$/,
    postalHint: '75001',
    taxIdLabel: 'TVA',
    taxIdRules: [/^FR[A-HJ-NP-Z0-9]{2}\d{9}$/i],
    taxIdHint:  'FRAB123456789',
  },
  {
    code:       'IT',
    name:       'Włochy',
    flag:       '🇮🇹',
    dialCode:   '+39',
    currency:   'EUR',
    locale:     'it-IT',
    timezone:   'Europe/Rome',
    postalCode: /^\d{5}$/,
    postalHint: '00100',
    taxIdLabel: 'P. IVA',
    taxIdRules: [/^IT\d{11}$/i],
    taxIdHint:  'IT12345678901',
  },
  {
    code:       'ES',
    name:       'Hiszpania',
    flag:       '🇪🇸',
    dialCode:   '+34',
    currency:   'EUR',
    locale:     'es-ES',
    timezone:   'Europe/Madrid',
    postalCode: /^\d{5}$/,
    postalHint: '28001',
    taxIdLabel: 'NIF / CIF',
    taxIdRules: [/^ES[A-Z0-9]\d{7}[A-Z0-9]$/i],
    taxIdHint:  'ESA1234567Z',
  },
  {
    code:       'NL',
    name:       'Holandia',
    flag:       '🇳🇱',
    dialCode:   '+31',
    currency:   'EUR',
    locale:     'nl-NL',
    timezone:   'Europe/Amsterdam',
    postalCode: /^\d{4} ?[A-Z]{2}$/i,
    postalHint: '1011 AB',
    taxIdLabel: 'BTW',
    taxIdRules: [/^NL\d{9}B\d{2}$/i],
    taxIdHint:  'NL123456789B01',
  },
  {
    code:       'CZ',
    name:       'Czechy',
    flag:       '🇨🇿',
    dialCode:   '+420',
    currency:   'EUR',
    locale:     'cs-CZ',
    timezone:   'Europe/Prague',
    postalCode: /^\d{3} ?\d{2}$/,
    postalHint: '110 00',
    taxIdLabel: 'DIČ',
    taxIdRules: [/^CZ\d{8,10}$/i],
    taxIdHint:  'CZ12345678',
  },
  {
    code:       'SE',
    name:       'Szwecja',
    flag:       '🇸🇪',
    dialCode:   '+46',
    currency:   'EUR',
    locale:     'sv-SE',
    timezone:   'Europe/Stockholm',
    postalCode: /^\d{3} ?\d{2}$/,
    postalHint: '114 21',
    taxIdLabel: 'Momsnr.',
    taxIdRules: [/^SE\d{12}$/i],
    taxIdHint:  'SE123456789012',
  },
  {
    code:       'CH',
    name:       'Szwajcaria',
    flag:       '🇨🇭',
    dialCode:   '+41',
    currency:   'EUR',
    locale:     'de-CH',
    timezone:   'Europe/Zurich',
    postalCode: /^\d{4}$/,
    postalHint: '8001',
    taxIdLabel: 'UID',
    taxIdRules: [/^CHE-\d{3}\.\d{3}\.\d{3}( (MWST|TVA|IVA))?$/i],
    taxIdHint:  'CHE-123.456.789 MWST',
  },
] as const

export const DEFAULT_COUNTRY_CODE = 'PL'

export const CURRENCIES: readonly { code: CurrencyCode; label: string }[] = [
  { code: 'PLN', label: 'PLN — złoty' },
  { code: 'EUR', label: 'EUR — euro' },
] as const

export const LOCALES: readonly { code: string; label: string }[] = [
  { code: 'pl-PL', label: 'Polski (PL)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'de-DE', label: 'Deutsch (DE)' },
  { code: 'fr-FR', label: 'Français (FR)' },
  { code: 'it-IT', label: 'Italiano (IT)' },
  { code: 'es-ES', label: 'Español (ES)' },
  { code: 'nl-NL', label: 'Nederlands (NL)' },
  { code: 'cs-CZ', label: 'Čeština (CZ)' },
  { code: 'sv-SE', label: 'Svenska (SE)' },
] as const

/**
 * Curated IANA timezones covering the supported markets. Keeping the list
 * small keeps the Select usable on mobile — we can swap for a searchable
 * combobox when the list grows past ~15 entries.
 */
export const TIMEZONES: readonly string[] = [
  'Europe/Warsaw',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Prague',
  'Europe/Stockholm',
  'Europe/Zurich',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'UTC',
] as const

export function findCountry(code: string | null | undefined): CountryMeta | undefined {
  if (!code) return undefined
  const normalized = code.toUpperCase()
  return COUNTRIES.find((country) => country.code === normalized)
}

export function getCountryOrDefault(code: string | null | undefined): CountryMeta {
  return findCountry(code) ?? COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE)!
}

/**
 * Best-effort inference of the country code from an existing tax identifier.
 * Used only when migrating legacy clients that have no explicit country_code.
 */
export function inferCountryFromTaxId(taxId: string | null | undefined): string | null {
  const normalized = taxId?.trim()
  if (!normalized) return null

  for (const country of COUNTRIES) {
    if (country.taxIdRules.some((rule) => rule.test(normalized))) {
      return country.code
    }
  }
  return null
}
