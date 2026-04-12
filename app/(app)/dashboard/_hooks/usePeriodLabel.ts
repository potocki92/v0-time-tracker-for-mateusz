import { useMemo } from 'react'
import { TIME_RANGE_OPTIONS } from '../_domain/dashboard.constants'
import type { TimeRange } from '../_domain/dashboard.types'

export function usePeriodLabel(range: TimeRange): string {
  return useMemo(
    () => TIME_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? '',
    [range]
  )
}
