'use client'

import { useDashboardData } from '../../_hooks'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { LinearTopBar } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

export function HeaderSection() {
  const { data } = useDashboardData()
  const { range } = useDashboardRange()
  const periodLabel = usePeriodLabel(range)

  const subtitle = data.userName
    ? `Hi ${data.userName}${periodLabel ? ` · ${periodLabel}` : ''}`
    : periodLabel

  return <LinearTopBar title="Dashboard" subtitle={subtitle} />
}
