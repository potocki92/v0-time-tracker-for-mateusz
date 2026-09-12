'use client'

import { useCallback, useMemo } from 'react'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import { APP_LOCALES, type AppLocale } from '@/i18n/config'
import {
  ALL,
  DEFAULT_STATEMENT_PRESET,
  STATEMENT_PERIOD_PRESETS,
  type DateKey,
  type StatementFilters,
  type StatementPeriodPreset,
} from '../domain'

/**
 * Stan filtrow wykazu trzymany w QUERY PARAMS.
 *
 * Dzieki temu wykaz jest adresowalny: odswiezenie strony i wyslany link
 * odtwarzaja ten sam dokument. Wartosci domyslne znikaja z adresu
 * (`clearOnDefault`), a historia przegladarki nie puchnie od kazdego
 * klikniecia (`history: 'replace'`).
 *
 * `lang` to jezyk DOKUMENTU, nie interfejsu — siedzi w adresie razem z reszta,
 * zeby „ten sam wykaz po niemiecku" dalo sie zapisac jako zakladke.
 */
const parsers = {
  preset: parseAsStringLiteral(STATEMENT_PERIOD_PRESETS).withDefault(DEFAULT_STATEMENT_PRESET),
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
  client: parseAsString.withDefault(ALL),
  lang: parseAsStringLiteral(APP_LOCALES),
}

const options = { history: 'replace', clearOnDefault: true, shallow: true } as const

export type UseAccountingFiltersReturn = {
  filters: StatementFilters
  /** Ile filtrow odbiega od stanu domyslnego — licznik przy „Resetuj". */
  activeCount: number
  setPreset: (preset: StatementPeriodPreset) => void
  setCustomRange: (from: DateKey, to: DateKey) => void
  setClient: (clientId: string) => void
  setDocumentLocale: (locale: AppLocale) => void
  reset: () => void
}

/**
 * @param uiLocale jezyk interfejsu — domyslny jezyk dokumentu, dopoki
 *   uzytkownik nie wybierze innego. To tylko wartosc POCZATKOWA: obie osie
 *   zostaja niezalezne (patrz `docs/i18n.md`, sekcja 15).
 */
export function useAccountingFilters(uiLocale: AppLocale): UseAccountingFiltersReturn {
  const [query, setQuery] = useQueryStates(parsers, options)

  const filters = useMemo<StatementFilters>(
    () => ({
      preset: query.preset,
      from: query.from,
      to: query.to,
      clientId: query.client,
      documentLocale: query.lang ?? uiLocale,
    }),
    [query, uiLocale],
  )

  const setPreset = useCallback(
    (preset: StatementPeriodPreset) => {
      // Wyjscie z zakresu wlasnego czysci daty — inaczej zostalyby w adresie
      // jako martwe parametry, mylace przy nastepnym otwarciu linku.
      setQuery(preset === 'custom' ? { preset } : { preset, from: null, to: null })
    },
    [setQuery],
  )

  const setCustomRange = useCallback(
    (from: DateKey, to: DateKey) => setQuery({ preset: 'custom', from, to }),
    [setQuery],
  )

  const setClient = useCallback((client: string) => setQuery({ client }), [setQuery])
  const setDocumentLocale = useCallback((lang: AppLocale) => setQuery({ lang }), [setQuery])

  const reset = useCallback(
    () => setQuery({ preset: null, from: null, to: null, client: null, lang: null }),
    [setQuery],
  )

  const activeCount =
    (filters.preset === DEFAULT_STATEMENT_PRESET ? 0 : 1) + (filters.clientId === ALL ? 0 : 1)

  return {
    filters,
    activeCount,
    setPreset,
    setCustomRange,
    setClient,
    setDocumentLocale,
    reset,
  }
}
