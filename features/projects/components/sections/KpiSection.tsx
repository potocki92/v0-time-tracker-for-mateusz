'use client'

import { CheckCircle2, FolderKanban, ListChecks, Wallet } from 'lucide-react'
import { StatTile } from '@/components/common/stat/StatTile'
import { formatCurrency } from '@/lib/helpers'
import { useProjectsData } from '../../hooks/useProjectsData'
import { useProjectsKpis } from '../../hooks/useProjectsKpis'

export function KpiSection() {
  const { data } = useProjectsData()
  const kpis = useProjectsKpis(data.projects)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile
        label="Wszystkie"
        value={String(kpis.total)}
        icon={FolderKanban}
        meta={`${kpis.planned} zaplanowanych`}
        accent="blue"
      />
      <StatTile
        label="W trakcie"
        value={String(kpis.active)}
        icon={ListChecks}
        meta={`${kpis.activeShare}% całości · ${kpis.onHold} wstrzymanych`}
        progress={kpis.activeShare}
        accent="emerald"
      />
      <StatTile
        label="Zakończone"
        value={String(kpis.completed)}
        icon={CheckCircle2}
        meta={`${kpis.completedShare}% całości`}
        progress={kpis.completedShare}
        accent="violet"
      />
      <StatTile
        label="Budżet"
        value={formatCurrency(kpis.totalBudget, kpis.totalBudgetCurrency)}
        icon={Wallet}
        meta={kpis.total > 0 ? `${kpis.total} umów` : 'Brak umów'}
        accent="amber"
      />
    </div>
  )
}
