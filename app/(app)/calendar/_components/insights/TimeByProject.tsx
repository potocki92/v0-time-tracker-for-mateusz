'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import type { ProjectAggregate } from '../../_domain/calendar.types'
import { stringToColor } from '../grid/clientColor'

interface Props {
  projects: ProjectAggregate[]
}

export function TimeByProject({ projects }: Props) {
  const total = projects.reduce((sum, p) => sum + p.amountPLN, 0)

  return (
    <Card className="border-border/60 py-0 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Time by project
          </h3>
          <span className="text-[11px] font-semibold tabular-nums text-foreground/80">
            {formatCurrency(total, 'PLN')}
          </span>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <Briefcase className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Brak przepracowanych godzin</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((project) => (
              <ProjectRow key={project.clientId} project={project} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectRow({ project }: { project: ProjectAggregate }) {
  const color = project.color || stringToColor(project.clientName)
  const percent = Math.round(project.shareOfHours * 100)

  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
          <span className="truncate text-xs font-medium text-foreground">
            {project.clientName}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 text-[11px] tabular-nums">
          <span className="font-semibold text-foreground">{project.hours.toFixed(1)}h</span>
          <span className="text-muted-foreground">
            {formatCurrency(project.amountPLN, 'PLN')}
          </span>
        </div>
      </div>

      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.clientName}: ${percent}% przepracowanych godzin`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out')}
          style={{
            width: `${Math.max(2, percent)}%`,
            background: color,
          }}
        />
      </div>

      <p className="mt-1 text-[10px] text-muted-foreground">
        {percent}% miesiąca
      </p>
    </li>
  )
}
