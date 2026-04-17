import { CircleDollarSign, Clock3, FolderKanban, ListTodo } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'
import type { ProjectStats as ProjectStatsType } from '../../_domain/projects.types'

type Props = ProjectStatsType

export function ProjectStats({ active, completed, planned, totalBudget }: Props) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatItem
            icon={<ListTodo className="h-4 w-4" />}
            label="W trakcie"
            value={String(active)}
            accent="text-blue-600 bg-blue-500/10"
          />
          <StatItem
            icon={<FolderKanban className="h-4 w-4" />}
            label="Zakończone"
            value={String(completed)}
            accent="text-emerald-600 bg-emerald-500/10"
          />
          <StatItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Planowane"
            value={String(planned)}
            accent="text-amber-600 bg-amber-500/10"
          />
          <StatItem
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="Suma budżetów"
            value={formatCurrency(totalBudget, 'PLN')}
            accent="text-violet-600 bg-violet-500/10"
          />
        </div>
      </CardContent>
    </Card>
  )
}

type StatItemProps = {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}

function StatItem({ icon, label, value, accent }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold sm:text-base">{value}</p>
      </div>
    </div>
  )
}
