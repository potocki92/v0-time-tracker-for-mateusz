import {
  ALL,
  DEFAULT_STATEMENT_PRESET,
  STATEMENT_PERIOD_PRESETS,
  type StatementFilters,
  type StatementPeriodPreset,
} from '@/features/accounting/domain'
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * Odczyt filtrow wykazu z query params PO STRONIE SERWERA.
 *
 * `nuqs` czyta te same parametry w przegladarce; tutaj potrzebna jest wersja
 * bez Reacta, zeby prefetch w `page.tsx` zlozyl ten sam klucz cache co klient.
 * Nazwy parametrow musza sie zgadzac z `useAccountingFilters` — to jedyny
 * punkt styku miedzy tymi dwoma odczytami.
 */
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export function parseStatementFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  /** Jezyk panelu — domyslny jezyk dokumentu, dopoki adres nie mowi inaczej. */
  uiLocale: AppLocale = DEFAULT_LOCALE,
): StatementFilters {
  const preset = first(searchParams.preset)
  const lang = first(searchParams.lang)

  return {
    preset: (STATEMENT_PERIOD_PRESETS as readonly string[]).includes(preset)
      ? (preset as StatementPeriodPreset)
      : DEFAULT_STATEMENT_PRESET,
    from: first(searchParams.from),
    to: first(searchParams.to),
    clientId: first(searchParams.client) || ALL,
    documentLocale: isAppLocale(lang) ? lang : uiLocale,
  }
}
