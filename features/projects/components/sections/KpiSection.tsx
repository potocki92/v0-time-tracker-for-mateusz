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
        label="All projects"
        value={String(kpis.total)}
        icon={FolderKanban}
        meta={`${kpis.planned} planned`}
        accent="blue"
      />
      <KpiTile
        label="In progress"
        value={String(kpis.active)}
        icon={ListChecks}
        meta={`${kpis.activeShare}% of all · ${kpis.onHold} on hold`}
        progress={kpis.activeShare}
        accent="emerald"
      />
      <KpiTile
        label="Completed"
        value={String(kpis.completed)}
        icon={CheckCircle2}
        meta={`${kpis.completedShare}% of all`}
        progress={kpis.completedShare}
        accent="violet"
      />
      <KpiTile
        label="Total budget"
        value={formatCurrency(kpis.totalBudget, kpis.totalBudgetCurrency)}
        icon={Wallet}
        meta={kpis.total > 0 ? `${kpis.total} contracts` : 'No contracts yet'}
        accent="amber"
      />
    </div>
  )
}
