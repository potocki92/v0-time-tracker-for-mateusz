import { useMemo } from 'react'
import { getTodayLocalDateString } from '@/lib/helpers'
import { partitionByRealization } from '@/lib/finance/realization'
import type { WorkEntry } from '@/lib/types'

/**
 * Dzieli wpisy na zrealizowane (real, data ≤ dziś) i planowane (predicted lub przyszłe).
 * Wartości rzeczywiste KPI liczymy z `realized`; `predicted` pokazujemy osobno.
 */
export function useRealizedEntries(entries: WorkEntry[]) {
  return useMemo(
    () => partitionByRealization(entries, getTodayLocalDateString()),
    [entries],
  )
}
