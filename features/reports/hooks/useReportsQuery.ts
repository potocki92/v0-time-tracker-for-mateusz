'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchWindowOf, rangeOf, type DateKey, type ReportFilters, type ReportsDataset } from '../domain'
import { reportsQueryOptions } from '../services/reports.query'

/**
 * Dataset raportu dla aktualnych filtrow.
 *
 * `keepPreviousData` jest tu swiadoma decyzja UX: zmiana zakresu tworzy NOWY
 * klucz cache, wiec bez tego caly ekran znikalby do skeletonu przy kazdym
 * przelaczeniu filtra. Zamiast tego poprzedni raport zostaje na ekranie
 * i przygasa, dopoki nie przyjdzie nowy.
 *
 * Pierwsze wejscie nie placi za to nic: `page.tsx` prefetchuje DOKLADNIE ten
 * sam klucz, wiec dane sa w cache juz przy pierwszym renderze.
 */
export function useReportsQuery(filters: ReportFilters, today: DateKey) {
  const window = fetchWindowOf(rangeOf(filters, today), filters.compare)

  return useQuery<ReportsDataset>({
    ...reportsQueryOptions({
      window,
      clientId: filters.clientId,
      projectId: filters.projectId,
    }),
    placeholderData: keepPreviousData,
    // Blad pobrania ma trafic do `ReportsContentBoundary`, a nie zawiesic
    // ekran na skeletonie w nieskonczonosc. `useQuery` domyslnie tylko
    // ustawia `isError`, wiec granica bledu nigdy by go nie zobaczyla.
    throwOnError: true,
  })
}
