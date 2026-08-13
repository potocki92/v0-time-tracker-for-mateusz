'use client'

import { CheckCircle2, FolderKanban, ListChecks, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import { useProjectsData } from '../../hooks/useProjectsData'
import { useProjectsKpis } from '../../hooks/useProjectsKpis'
import { KpiTile } from '../linear/KpiTile'

export function KpiSection() {
  const { data } = useProjectsData()
  const kpis = useProjectsKpis(data.projects)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiTile
        label="Wszystkie"
        value={String(kpis.total)}
        icon={FolderKanban}
        meta={`${kpis.planned} zaplanowanych`}
        accent="blue"
      />
      <KpiTile
        label="W trakcie"
        value={String(kpis.active)}
        icon={ListChecks}
        meta={`${kpis.activeShare}% całości · ${kpis.onHold} wstrzymanych`}
        progress={kpis.activeShare}
        accent="emerald"
      />
      <KpiTile
        label="Zakończone"
        value={String(kpis.completed)}
        icon={CheckCircle2}
        meta={`${kpis.completedShare}% całości`}
        progress={kpis.completedShare}
        accent="violet"
      />
      <KpiTile
        label="Budżet"
        value={formatCurrency(kpis.totalBudget, kpis.totalBudgetCurrency)}
        icon={Wallet}
        meta={kpis.total > 0 ? `${kpis.total} umów` : 'Brak umów'}
        accent="amber"
      />
    </div>
  )
}
