'use client'

import { useDashboardData } from '../../../hooks'
import { HeroGreeting } from './HeroGreeting'
import { LinearTopBar } from './LinearTopBar'
import { useDashboardRange } from '../shared/DashboardRangeContext'

export function HeaderSection() {
  const { data } = useDashboardData()
  const { range, setRange } = useDashboardRange()

  return (
    <>
      <LinearTopBar />
      <HeroGreeting userName={data.userName} range={range} onChangeRange={setRange} />
    </>
  )
}
