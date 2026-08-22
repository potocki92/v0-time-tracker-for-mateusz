'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import { formatHours, formatMoney, formatPercent } from '@/lib/format'
import type { CURRENCY } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { ProjectAggregate } from '../../domain/calendar.types'
import { stringToColor } from '../grid/clientColor'

interface Props {
  projects: ProjectAggregate[]
  currency: CURRENCY
}

export function TimeByProject({ projects, currency }: Props) {
  const total = projects.reduce((sum, p) => sum + p.amountMinor, 0)

  return (
    <Card className="rounded-lg border-hairline bg-surface-1 py-0 shadow-none">
      <CardContent className="p-4 sm:p-5">
        <header className="flex items-center justify-between">
          <SectionEyebrow as="h3">Czas wg projektu</SectionEyebrow>
          <span className="text-2xs font-semibold tabular-nums text-zinc-300">
            {formatMoney(total, currency)}
          </span>
        </header>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <Briefcase className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-400">Brak przepracowanych godzin</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((project) => (
              <ProjectRow key={project.projectId} project={project} currency={currency} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectRow({
  project,
  currency,
}: {
  project: ProjectAggregate
  currency: CURRENCY
}) {
  const color = project.color || stringToColor(project.name)
  const percent = Math.round(project.share * 100)

  return (
    <li>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: color }}
            aria-hidden
          />
          <span className="truncate text-xs font-medium text-white">
            {project.name}
          </span>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 text-2xs tabular-nums">
          <span className="font-semibold text-white">{formatHours(project.hours)}</span>
          <span className="text-zinc-400">
            {formatMoney(project.amountMinor, currency)}
          </span>
        </div>
      </div>

      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.name}: ${formatPercent(project.share)} przepracowanych godzin`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out')}
          style={{
            width: `${Math.max(2, percent)}%`,
            background: color,
          }}
        />
      </div>

      <p className="mt-1 text-2xs text-zinc-400">
        {formatPercent(project.share)} miesiąca
      </p>
    </li>
  )
}
