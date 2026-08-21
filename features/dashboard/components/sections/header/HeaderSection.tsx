'use client'

import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import { selectUserName } from '../../../hooks/dashboardSelectors'
import { HeroGreeting } from './HeroGreeting'
import { LinearTopBar } from './LinearTopBar'
import { useDashboardRange } from '../shared/DashboardRangeContext'

export function HeaderSection() {
  const userName = useDashboardSlice(selectUserName)
  const { range, setRange } = useDashboardRange()

  return (
    <>
      <LinearTopBar />
      <HeroGreeting userName={userName} range={range} onChangeRange={setRange} />
    </>
  )
}
