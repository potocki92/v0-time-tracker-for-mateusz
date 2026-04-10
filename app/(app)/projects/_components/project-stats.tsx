import { CircleDollarSign, Clock3, FolderKanban, ListTodo } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/helpers'

type ProjectStatsProps = {
  active: number
  completed: number
  planned: number
  totalBudget: number
}

export function ProjectStats({ active, completed, planned, totalBudget }: ProjectStatsProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatItem
            icon={<ListTodo className="h-4 w-4" />}
            label="W trakcie"
            value={String(active)}
            className="text-blue-600 bg-blue-500/10"
          />
          <StatItem
            icon={<FolderKanban className="h-4 w-4" />}
            label="Zakończone"
            value={String(completed)}
            className="text-emerald-600 bg-emerald-500/10"
          />
          <StatItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Planowane"
            value={String(planned)}
            className="text-amber-600 bg-amber-500/10"
          />
          <StatItem
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="Suma budżetów"
            value={formatCurrency(totalBudget, 'PLN')}
            className="text-violet-600 bg-violet-500/10"
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
  className: string
}

function StatItem({ icon, label, value, className }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${className}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold sm:text-base">{value}</p>
      </div>
    </div>
  )
}
