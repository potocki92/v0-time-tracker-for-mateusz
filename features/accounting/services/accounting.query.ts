import { QUERY_CONFIG, QUERY_KEYS, fetchJson } from '@/lib/query'
import { ALL, type AccountingDataset, type StatementRange } from '../domain/types'

/**
 * Parametry odczytu wykazu — dokladnie to, co da sie przelozyc na WHERE.
 *
 * Jezyka dokumentu tu NIE MA: zmienia wylacznie etykiety w pliku, wiec
 * wchodzenie z nim do klucza cache pobieraloby te same dane trzeci raz.
 */
export type AccountingQueryParams = {
  range: StatementRange
  clientId: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function accountingSearchParams(params: AccountingQueryParams): URLSearchParams {
  return new URLSearchParams({
    from: params.range.start,
    to: params.range.end,
    client: params.clientId,
  })
}

/**
 * Odwrotnosc `accountingSearchParams` — uzywana przez route handler.
 *
 * Walidacja formatu dat nie jest tu kosmetyka: obie wartosci trafiaja do
 * filtra PostgREST budowanego jako tekst (`or=and(invoice_date.gte.…)`).
 */
export function parseAccountingSearchParams(
  search: URLSearchParams,
): AccountingQueryParams | null {
  const from = search.get('from') ?? ''
  const to = search.get('to') ?? ''
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return null

  return {
    range: { start: from, end: to },
    clientId: search.get('client') || ALL,
  }
}

/**
 * Jedna definicja odczytu: klucz cache, adres i konfiguracja.
 *
 * Trzymana osobno od hooka, zeby prefetch serwerowy (`page.tsx`) i zapytanie
 * klienckie zlozyly DOKLADNIE ten sam klucz — inaczej hydracja nie trafialaby
 * w cache i wykaz pobieralby sie dwa razy.
 */
export function accountingQueryOptions(params: AccountingQueryParams) {
  const search = accountingSearchParams(params)
  return {
    queryKey: QUERY_KEYS.accounting({
      from: params.range.start,
      to: params.range.end,
      clientId: params.clientId,
    }),
    queryFn: () => fetchJson<AccountingDataset>(`/api/accounting?${search.toString()}`),
    ...QUERY_CONFIG.accounting,
  }
}
