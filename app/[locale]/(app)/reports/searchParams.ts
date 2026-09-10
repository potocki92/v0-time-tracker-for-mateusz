import {
  ALL,
  DEFAULT_PERIOD_PRESET,
  REPORT_PERIOD_PRESETS,
  type ReportFilters,
  type ReportPeriodPreset,
} from '@/features/reports/domain'

/**
 * Odczyt filtrow raportu z query params PO STRONIE SERWERA.
 *
 * `nuqs` czyta te same parametry w przegladarce; tutaj potrzebna jest wersja
 * bez Reacta, zeby prefetch w `page.tsx` zlozyl ten sam klucz cache co klient.
 * Nazwy parametrow musza sie zgadzac z `useReportsFilters` — to jedyny punkt
 * styku miedzy tymi dwoma odczytami.
 */
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export function parseReportFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ReportFilters {
  const preset = first(searchParams.preset)

  return {
    preset: (REPORT_PERIOD_PRESETS as readonly string[]).includes(preset)
      ? (preset as ReportPeriodPreset)
      : DEFAULT_PERIOD_PRESET,
    from: first(searchParams.from),
    to: first(searchParams.to),
    clientId: first(searchParams.client) || ALL,
    projectId: first(searchParams.project) || ALL,
    tag: first(searchParams.tag) || ALL,
    compare: first(searchParams.compare) === 'true',
  }
}
