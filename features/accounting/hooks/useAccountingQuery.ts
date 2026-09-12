'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { rangeOf, type AccountingDataset, type DateKey, type StatementFilters } from '../domain'
import { accountingQueryOptions } from '../services/accounting.query'

/**
 * Dataset wykazu dla aktualnych filtrow.
 *
 * `keepPreviousData` jest swiadoma decyzja UX: zmiana zakresu tworzy NOWY
 * klucz cache, wiec bez tego caly ekran znikalby do skeletonu przy kazdym
 * przelaczeniu roku. Zamiast tego poprzedni wykaz zostaje i przygasa.
 *
 * Jezyk dokumentu nie wchodzi do klucza — zmienia etykiety w pliku, nie dane.
 */
export function useAccountingQuery(filters: StatementFilters, today: DateKey) {
  return useQuery<AccountingDataset>({
    ...accountingQueryOptions({
      range: rangeOf(filters, today),
      clientId: filters.clientId,
    }),
    placeholderData: keepPreviousData,
    // Blad pobrania ma trafic do granicy bledu, a nie zawiesic ekran
    // na skeletonie: `useQuery` domyslnie tylko ustawia `isError`.
    throwOnError: true,
  })
}
