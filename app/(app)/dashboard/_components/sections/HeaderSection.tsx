'use client'

import { useDashboardData } from '../../_hooks'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { DashboardHeader } from '../DashboardHeader'
import { useDashboardRange } from './DashboardRangeContext'

export function HeaderSection() {
  const { data } = useDashboardData()
  const { range, setRange } = useDashboardRange()
  const periodLabel = usePeriodLabel(range)

  return (
    <DashboardHeader
      range={range}
      onChangeRange={setRange}
      userName={data.userName}
      periodLabel={periodLabel}
    />
  )
}
