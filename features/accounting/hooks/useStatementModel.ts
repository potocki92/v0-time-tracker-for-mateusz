'use client'

import { useMemo } from 'react'
import {
  buildStatementModel,
  type AccountingDataset,
  type DateKey,
  type StatementModel,
} from '../domain'

/**
 * Memoizacja modelu wykazu.
 *
 * Hook nie liczy niczego sam — cala arytmetyka siedzi w `buildStatementModel`.
 * Jego jedyne zadanie to nie przechodzic po rocznym zbiorze faktur i wpisow
 * przy kazdym renderze (rozwiniecie wiersza tabeli to render).
 */
export function useStatementModel(
  dataset: AccountingDataset | undefined,
  today: DateKey,
): StatementModel | null {
  return useMemo(
    () => (dataset ? buildStatementModel(dataset, today) : null),
    [dataset, today],
  )
}
