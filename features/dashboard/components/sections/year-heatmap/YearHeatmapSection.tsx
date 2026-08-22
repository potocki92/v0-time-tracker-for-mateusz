'use client'

import { useDashboardDerived } from '../shared/DashboardDerivedContext'
import { YearHeatmapCard } from './YearHeatmapCard'

export function YearHeatmapSection() {
  // `realizedAll` ignoruje zakres: siatka ma wlasne okno tygodni, a przy
  // zakresie „biezacy tydzien" pokazywalaby jeden zapelniony i pol setki pustych.
  const { realizedAll } = useDashboardDerived()

  return <YearHeatmapCard entries={realizedAll} />
}
