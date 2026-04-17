'use client'

import { AlertTriangle, Building2, CalendarDays, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Project } from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'
import type { ProjectProgress } from '../../_domain/projects.types'

type Props = {
  project: Project
  clientName: string
  progress: ProjectProgress
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function isAtRisk(project: Project): boolean {
  if (project.status !== 'in_progress' || !project.end_date) return false
  const end = new Date(project.end_date).getTime()
  const now = Date.now()
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return daysLeft <= 7
}

export function ProjectCard({ project, clientName, progress, onEdit, onDelete }: Props) {
  const atRisk = isAtRisk(project)
  const showProgress = progress.target > 0

  return (
    <Card className="group relative overflow-hidden transition-colors hover:border-foreground/20">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: project.color }}
        aria-hidden
      />

      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={PROJECT_STATUS_BADGE_CLASS[project.status]}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Badge variant="outline" className={PROJECT_PRIORITY_BADGE_CLASS[project.priority]}>
                {PRIORITY_LABELS[project.priority]}
              </Badge>
              {atRisk && (
                <Badge variant="outline" className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  Zagrożony
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 opacity-60 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label="Akcje projektu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(project)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {project.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        {showProgress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Postęp realizacji</span>
              <span className="font-medium">
                {progress.quantityDone}/{progress.target}
                <span className="ml-1.5 text-muted-foreground">
                  · {progress.percent.toFixed(0)}%
                </span>
              </span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-sm">
          <Meta icon={<Building2 className="h-3.5 w-3.5" />} label="Klient">
            <span className="truncate font-medium">{clientName}</span>
          </Meta>
          <Meta icon={<CalendarDays className="h-3.5 w-3.5" />} label="Termin">
            <span className="truncate font-medium">
              {project.end_date ? formatDate(project.end_date) : 'Brak'}
            </span>
          </Meta>
          <Meta label="Budżet">
            <span className="font-medium">
              {project.budget_amount ? formatCurrency(project.budget_amount, 'PLN') : '—'}
            </span>
          </Meta>
          <Meta label="Start">
            <span className="font-medium">
              {project.start_date ? formatDate(project.start_date) : '—'}
            </span>
          </Meta>
        </div>
      </CardContent>
    </Card>
  )
}

function Meta({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <div className="truncate text-sm">{children}</div>
    </div>
  )
}
