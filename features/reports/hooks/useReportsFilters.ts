'use client'

import { useCallback, useMemo } from 'react'
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import {
  ALL,
  DEFAULT_PERIOD_PRESET,
  REPORT_PERIOD_PRESETS,
  type DateKey,
  type ReportFilters,
  type ReportPeriodPreset,
} from '../domain'

/**
 * Stan filtrow raportu trzymany w QUERY PARAMS.
 *
 * Dzieki temu raport jest adresowalny: odswiezenie strony, zakladka i link
 * wyslany sobie na drugi ekran odtwarzaja dokladnie ten sam widok. Wartosci
 * domyslne znikaja z adresu (`clearOnDefault`), wiec czysty `/reports` zostaje
 * czysty, a historia przegladarki nie puchnie od kazdego klikniecia w filtr
 * (`history: 'replace'`).
 */
const parsers = {
  preset: parseAsStringLiteral(REPORT_PERIOD_PRESETS).withDefault(DEFAULT_PERIOD_PRESET),
  from: parseAsString.withDefault(''),
  to: parseAsString.withDefault(''),
  client: parseAsString.withDefault(ALL),
  project: parseAsString.withDefault(ALL),
  tag: parseAsString.withDefault(ALL),
  compare: parseAsBoolean.withDefault(false),
}

const options = { history: 'replace', clearOnDefault: true, shallow: true } as const

export type UseReportsFiltersReturn = {
  filters: ReportFilters
  /** Ile filtrow odbiega od stanu domyslnego — licznik na przycisku „Filtry". */
  activeCount: number
  setPreset: (preset: ReportPeriodPreset) => void
  setCustomRange: (from: DateKey, to: DateKey) => void
  /**
   * Klient i projekt zmieniaja sie RAZEM: kaskade liczy `projectAfterClientChange`,
   * zeby w adresie nie zostal projekt innego klienta.
   */
  setClient: (clientId: string, projectId: string) => void
  setProjectId: (projectId: string) => void
  setTag: (tag: string) => void
  toggleCompare: () => void
  reset: () => void
}

export function useReportsFilters(): UseReportsFiltersReturn {
  const [query, setQuery] = useQueryStates(parsers, options)

  const filters = useMemo<ReportFilters>(
    () => ({
      preset: query.preset,
      from: query.from,
      to: query.to,
      clientId: query.client,
      projectId: query.project,
      tag: query.tag,
      compare: query.compare,
    }),
    [query],
  )

  const setPreset = useCallback(
    (preset: ReportPeriodPreset) => {
      // Wyjscie z zakresu wlasnego czysci daty — inaczej zostalyby w adresie
      // jako martwe parametry mylace przy nastepnym udostepnieniu linku.
      setQuery(preset === 'custom' ? { preset } : { preset, from: null, to: null })
    },
    [setQuery],
  )

  const setCustomRange = useCallback(
    (from: DateKey, to: DateKey) => setQuery({ preset: 'custom', from, to }),
    [setQuery],
  )

  const setClient = useCallback(
    (client: string, project: string) => setQuery({ client, project }),
    [setQuery],
  )

  const setProjectId = useCallback((project: string) => setQuery({ project }), [setQuery])
  const setTag = useCallback((tag: string) => setQuery({ tag }), [setQuery])
  const toggleCompare = useCallback(
    () => setQuery((prev) => ({ compare: !prev.compare })),
    [setQuery],
  )

  const reset = useCallback(
    () => setQuery({ preset: null, from: null, to: null, client: null, project: null, tag: null }),
    [setQuery],
  )

  const activeCount =
    (filters.preset === DEFAULT_PERIOD_PRESET ? 0 : 1) +
    (filters.clientId === ALL ? 0 : 1) +
    (filters.projectId === ALL ? 0 : 1) +
    (filters.tag === ALL ? 0 : 1)

  return {
    filters,
    activeCount,
    setPreset,
    setCustomRange,
    setClient,
    setProjectId,
    setTag,
    toggleCompare,
    reset,
  }
}
