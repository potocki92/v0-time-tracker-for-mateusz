import { CircleDollarSign, Clock3, FolderKanban, ListTodo } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/helpers'
import type { ProjectStats as ProjectStatsType } from '../../_domain/projects.types'

type Props = ProjectStatsType

/**
 * Stats summary row — mobile-first 2×2 grid that expands to 4 tiles on sm+.
 * Stylowo spójne z kartami w Kalendarzu (HoursCard/DaysCard).
 */
export function ProjectStats({ total, active, completed, planned, totalBudget }: Props) {
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0
  const completedPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <StatCard
        icon={<FolderKanban className="h-4 w-4" />}
        label="Wszystkie"
        value={String(total)}
        accent="blue"
        meta={`${planned} planowane`}
      />
      <StatCard
        icon={<ListTodo className="h-4 w-4" />}
        label="W trakcie"
        value={String(active)}
        accent="emerald"
        progress={activePercent}
        meta={`${activePercent}% ogółu`}
      />
      <StatCard
        icon={<Clock3 className="h-4 w-4" />}
        label="Zakończone"
        value={String(completed)}
        accent="violet"
        progress={completedPercent}
        meta={`${completedPercent}% ogółu`}
      />
      <StatCard
        icon={<CircleDollarSign className="h-4 w-4" />}
        label="Suma budżetów"
        value={formatCurrency(totalBudget, 'PLN')}
        accent="amber"
        valueClassName="text-base sm:text-xl"
      />
    </div>
  )
}

type Accent = 'blue' | 'emerald' | 'violet' | 'amber'

const ACCENT_MAP: Record<Accent, { bg: string; fg: string; bar: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    fg: 'text-blue-600 dark:text-blue-400',
    bar: '[&>div]:bg-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600 dark:text-emerald-400',
    bar: '[&>div]:bg-emerald-500',
  },
  violet: {
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600 dark:text-violet-400',
    bar: '[&>div]:bg-violet-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    fg: 'text-amber-600 dark:text-amber-400',
    bar: '[&>div]:bg-amber-500',
  },
}

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: string
  accent: Accent
  progress?: number
  meta?: string
  valueClassName?: string
}

function StatCard({ icon, label, value, accent, progress, meta, valueClassName }: StatCardProps) {
  const palette = ACCENT_MAP[accent]

  return (
    <Card className="border-border/60 py-0 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              {label}
            </p>
            <p
              className={cn(
                'mt-1 truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl',
                valueClassName,
              )}
            >
              {value}
            </p>
          </div>
          <div className={cn('rounded-lg p-2', palette.bg)}>
            <span className={palette.fg}>{icon}</span>
          </div>
        </div>

        {progress !== undefined ? (
          <div className="mt-3 space-y-1.5">
            {meta ? (
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">{meta}</p>
            ) : null}
            <Progress value={progress} className={cn('h-1.5', palette.bar)} />
          </div>
        ) : meta ? (
          <p className="mt-3 truncate text-[10px] text-muted-foreground sm:text-[11px]">{meta}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
