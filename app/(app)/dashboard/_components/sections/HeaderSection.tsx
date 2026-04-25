'use client'

import { useDashboardData } from '../../_hooks'
import { HeroGreeting, LinearTopBar } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

export function HeaderSection() {
  const { data } = useDashboardData()
  const { range, setRange } = useDashboardRange()

  return (
    <>
      <LinearTopBar title="Dashboard" />
      <HeroGreeting userName={data.userName} range={range} onChangeRange={setRange} />
    </>
  )
}
