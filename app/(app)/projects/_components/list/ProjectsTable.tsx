'use client'

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/helpers'
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type Client,
  type Project,
  type WorkEntry,
} from '@/lib/types'
import {
  PROJECT_PRIORITY_BADGE_CLASS,
  PROJECT_STATUS_BADGE_CLASS,
} from '../../_domain/projects.constants'
import {
  selectClientName,
  selectProjectProgress,
} from '../../_domain/projects.selectors'
import type {
  ProjectProgress,
  ProjectsSortDirection,
  ProjectsSortKey,
} from '../../_domain/projects.types'

type Props = {
  projects:      Project[]
  clients:       Client[]
  workEntries:   WorkEntry[]
  sortKey:       ProjectsSortKey
  sortDirection: ProjectsSortDirection
  onSort:        (key: ProjectsSortKey) => void
  onEdit:        (project: Project) => void
  onDelete:      (project: Project) => void
}

export function ProjectsTable({
  projects,
  clients,
  workEntries,
  sortKey,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[28%] min-w-[220px]">
              <SortButton
                label="Nazwa"
                active={sortKey === 'name'}
                direction={sortDirection}
                onClick={() => onSort('name')}
              />
            </TableHead>
            <TableHead className="hidden min-w-[160px] sm:table-cell">
              <SortButton
                label="Klient"
                active={sortKey === 'client'}
                direction={sortDirection}
                onClick={() => onSort('client')}
              />
            </TableHead>
            <TableHead className="min-w-[120px]">
              <SortButton
                label="Status"
                active={sortKey === 'status'}
                direction={sortDirection}
                onClick={() => onSort('status')}
              />
            </TableHead>
            <TableHead className="hidden min-w-[110px] md:table-cell">
              <SortButton
                label="Priorytet"
                active={sortKey === 'priority'}
                direction={sortDirection}
                onClick={() => onSort('priority')}
              />
            </TableHead>
            <TableHead className="hidden min-w-[120px] text-right lg:table-cell">
              <SortButton
                label="Budżet"
                active={sortKey === 'budget'}
                direction={sortDirection}
                onClick={() => onSort('budget')}
                align="right"
              />
            </TableHead>
            <TableHead className="min-w-[120px] text-right">
              <SortButton
                label="Termin"
                active={sortKey === 'end_date'}
                direction={sortDirection}
                onClick={() => onSort('end_date')}
                align="right"
              />
            </TableHead>
            <TableHead className="hidden min-w-[120px] text-right xl:table-cell">
              <SortButton
                label="Start"
                active={sortKey === 'start_date'}
                direction={sortDirection}
                onClick={() => onSort('start_date')}
                align="right"
              />
            </TableHead>
            <TableHead className="w-[1%] text-right">
              <span className="sr-only">Akcje</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              clientName={selectClientName(project.client_id, clients)}
              progress={selectProjectProgress(project, workEntries)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  clientName,
  progress,
  onEdit,
  onDelete,
}: {
  project:    Project
  clientName: string
  progress:   ProjectProgress
  onEdit:     (p: Project) => void
  onDelete:   (p: Project) => void
}) {
  const atRisk = isAtRisk(project)
  const showProgress = progress.target > 0

  return (
    <TableRow className="group">
      <TableCell className="align-top">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-9 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <div className="truncate font-medium">{project.name}</div>
            {project.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {project.description}
              </p>
            )}
            {/* Meta ujawniane na mobile, ukryte od sm+ — kompensacja ukrytych kolumn */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:hidden">
              <span className="truncate">{clientName}</span>
            </div>
            {showProgress && (
              <div className="flex items-center gap-2 pt-1">
                <Progress value={progress.percent} className="h-1 w-24" />
                <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
                  {progress.quantityDone}/{progress.target}
                </span>
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="hidden align-top sm:table-cell">
        <span className="truncate">{clientName}</span>
      </TableCell>

      <TableCell className="align-top">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={PROJECT_STATUS_BADGE_CLASS[project.status]}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          {atRisk && (
            <Badge
              variant="outline"
              className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden />
              <span className="sr-only sm:not-sr-only">Zagrożony</span>
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden align-top md:table-cell">
        <Badge variant="outline" className={PROJECT_PRIORITY_BADGE_CLASS[project.priority]}>
          {PRIORITY_LABELS[project.priority]}
        </Badge>
      </TableCell>

      <TableCell className="hidden text-right align-top tabular-nums lg:table-cell">
        {project.budget_amount
          ? formatCurrency(project.budget_amount, 'PLN')
          : <span className="text-muted-foreground">—</span>}
      </TableCell>

      <TableCell className="text-right align-top tabular-nums">
        {project.end_date ? (
          <span className={cn(atRisk && 'font-medium text-rose-600 dark:text-rose-400')}>
            {formatDate(project.end_date)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="hidden text-right align-top tabular-nums xl:table-cell">
        {project.start_date
          ? formatDate(project.start_date)
          : <span className="text-muted-foreground">—</span>}
      </TableCell>

      <TableCell className="text-right align-top">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 opacity-60 transition-opacity group-hover:opacity-100 focus:opacity-100"
              aria-label={`Akcje projektu ${project.name}`}
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
      </TableCell>
    </TableRow>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isAtRisk(project: Project): boolean {
  if (project.status !== 'in_progress' || !project.end_date) return false
  const end = new Date(project.end_date).getTime()
  const now = Date.now()
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return daysLeft <= 7
}

function SortButton({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label:     string
  active:    boolean
  direction: ProjectsSortDirection
  onClick:   () => void
  align?:    'left' | 'right'
}) {
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex w-full items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {align === 'right' && <Icon className="h-3 w-3" aria-hidden />}
      {label}
      {align === 'left' && <Icon className="h-3 w-3" aria-hidden />}
    </button>
  )
}
