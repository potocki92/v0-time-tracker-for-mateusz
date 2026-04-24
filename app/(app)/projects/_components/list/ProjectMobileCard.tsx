'use client'

import { useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  Flag,
  Pencil,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Project } from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'
import type { ProjectProgress } from '../../_domain/projects.types'

type Props = {
  project: Project
  clientName?: string
  selected: boolean
  progress?: ProjectProgress
  onToggleSelect: (checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function ProjectMobileCard({
  project,
  clientName,
  selected,
  progress,
  onToggleSelect,
  onEdit,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasDeadline = Boolean(project.end_date)
  const isOverdue =
    hasDeadline &&
    project.status !== 'completed' &&
    new Date(project.end_date as string).getTime() < Date.now()
  const hasProgress = progress && progress.target > 0

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-colors',
        'hover:bg-accent/30 focus-within:ring-2 focus-within:ring-ring/60',
        selected ? 'border-primary/50 ring-1 ring-primary/40' : 'border-border/60',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: project.color }}
      />

      <div className="flex items-start gap-3 pl-4 pr-2 pt-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onToggleSelect(checked === true)}
          aria-label={`Zaznacz projekt ${project.name}`}
          className="mt-1 h-5 w-5 shrink-0"
        />

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`project-${project.id}-details`}
          className="group -mx-1 flex min-w-0 flex-1 items-start gap-2 rounded-md px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <h3
              className="line-clamp-2 break-words text-[15px] font-semibold leading-tight"
              title={project.name}
            >
              {project.name}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn('text-[11px]', PROJECT_STATUS_BADGE_CLASS[project.status])}
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'inline-flex items-center gap-1 text-[11px]',
                  PROJECT_PRIORITY_BADGE_CLASS[project.priority],
                )}
              >
                <Flag className="h-3 w-3" />
                {PRIORITY_LABELS[project.priority]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex min-w-0 items-center gap-1">
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{clientName ?? 'Bez klienta'}</span>
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  isOverdue && 'font-medium text-rose-600 dark:text-rose-400',
                )}
              >
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {hasDeadline ? formatDate(project.end_date as string) : 'Brak terminu'}
              </span>
            </div>

            {hasProgress ? (
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {Math.round(progress!.quantityDone)} / {progress!.target}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {Math.round(progress!.percent)}%
                  </span>
                </div>
                <Progress
                  value={progress!.percent}
                  className={cn(
                    'h-1.5',
                    project.status === 'completed'
                      ? '[&>div]:bg-emerald-500'
                      : '[&>div]:bg-blue-500',
                  )}
                />
              </div>
            ) : null}
          </div>

          <ChevronDown
            className={cn(
              'mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </div>

      <div
        id={`project-${project.id}-details`}
        hidden={!expanded}
        className="space-y-3 px-4 pb-3 pt-3"
      >
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow
              label="Klient"
              value={
                <span className="inline-flex min-w-0 items-center gap-2">
                  <Avatar className="size-6 border border-border/60">
                    <AvatarFallback className="text-[10px] font-semibold">
                      {getInitials(clientName ?? 'Brak')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{clientName ?? 'Bez klienta'}</span>
                </span>
              }
            />
            <DetailRow
              label="Budżet"
              value={
                project.budget_amount
                  ? formatCurrency(Number(project.budget_amount), 'PLN')
                  : '—'
              }
            />
            <DetailRow
              label="Start"
              value={project.start_date ? formatDate(project.start_date) : '—'}
            />
            <DetailRow
              label="Koniec"
              value={project.end_date ? formatDate(project.end_date) : '—'}
            />
          </div>

          {project.description ? (
            <div className="mt-3 border-t border-border/60 pt-3">
              <DetailRow
                label="Opis"
                value={
                  <span className="block break-words text-sm leading-relaxed">
                    {project.description}
                  </span>
                }
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11"
            onClick={onEdit}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń
          </Button>
        </div>
      </div>
    </article>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 break-words text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
