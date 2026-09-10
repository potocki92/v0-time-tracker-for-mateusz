'use client'

import { useMemo } from 'react'
import { buildReportModel, type DateKey, type ReportFilters, type ReportModel, type ReportsDataset } from '../domain'

/**
 * Memoizacja modelu raportu.
 *
 * Hook nie liczy niczego sam — cala arytmetyka siedzi w `buildReportModel`.
 * Jego jedyne zadanie to nie przeliczac tego samego przy kazdym renderze:
 * bez memo kazde otwarcie tooltipa na wykresie przechodzilo by po calym
 * zbiorze wpisow od nowa.
 */
export function useReportModel(
  dataset: ReportsDataset | undefined,
  filters: ReportFilters,
  today: DateKey,
): ReportModel | null {
  return useMemo(
    () => (dataset ? buildReportModel(dataset, filters, today) : null),
    [dataset, filters, today],
  )
}
