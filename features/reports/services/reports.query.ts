import { QUERY_CONFIG, QUERY_KEYS, fetchJson } from '@/lib/query'
import { ALL, type ReportRange, type ReportsDataset } from '../domain/types'

/**
 * Parametry odczytu raportu — dokladnie to, co da sie przelozyc na WHERE.
 * Tag zostaje po stronie domeny: filtr po tagu zawezilby liste dostepnych
 * tagow do jednego, wiec UI nie mialoby czym wypelnic selekta.
 */
export type ReportsQueryParams = {
  window: ReportRange
  clientId: string
  projectId: string
}

/**
 * Jedna definicja odczytu raportu: klucz cache, adres i konfiguracja.
 *
 * Trzymana osobno od hooka, zeby prefetch serwerowy (page.tsx) i zapytanie
 * kliencke skladaly DOKLADNIE ten sam klucz — inaczej hydracja nie trafilaby
 * w cache i kazde wejscie na raport pobieraloby dane drugi raz.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function reportsSearchParams(params: ReportsQueryParams): URLSearchParams {
  return new URLSearchParams({
    from: params.window.start,
    to: params.window.end,
    client: params.clientId,
    project: params.projectId,
  })
}

/** Odwrotnosc `reportsSearchParams` — uzywana przez route handler. */
export function parseReportsSearchParams(search: URLSearchParams): ReportsQueryParams | null {
  const from = search.get('from') ?? ''
  const to = search.get('to') ?? ''
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return null

  return {
    window: { start: from, end: to },
    clientId: search.get('client') || ALL,
    projectId: search.get('project') || ALL,
  }
}

export function reportsQueryOptions(params: ReportsQueryParams) {
  const search = reportsSearchParams(params)
  return {
    queryKey: QUERY_KEYS.reports({
      from: params.window.start,
      to: params.window.end,
      clientId: params.clientId,
      projectId: params.projectId,
    }),
    queryFn: () => fetchJson<ReportsDataset>(`/api/reports?${search.toString()}`),
    ...QUERY_CONFIG.reports,
  }
}
