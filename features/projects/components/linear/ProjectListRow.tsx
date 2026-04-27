'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/helpers'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PROJECT_PRIORITY_PILL, PROJECT_STATUS_PILL } from '../../types/projects.constants'
import type { ProjectListRow as ProjectListRowType } from '../../types/projects.types'

type ProjectListRowProps = {
  row: ProjectListRowType
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

function formatDue(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })
}

function clientInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function ProjectListRow({ row, onEdit, onDelete }: ProjectListRowProps) {
  const {
    project,
    clientName,
    clientColor,
    progressPct,
    hoursLogged,
    budget,
    budgetUtilization,
    dueDate,
    isAtRisk,
  } = row
  const statusPill = PROJECT_STATUS_PILL[project.status]
  const priorityPill = PROJECT_PRIORITY_PILL[project.priority]
  const hasActions = Boolean(onEdit || onDelete)

  return (
    <li
      className={cn(
        'group rounded-xl border bg-[#0c0c0c] p-3.5 transition hover:border-zinc-700/60',
        'border-[#161616]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-white">{project.name}</p>
          {project.description ? (
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">{project.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              statusPill.className,
            )}
          >
            {statusPill.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              priorityPill.className,
            )}
          >
            {priorityPill.label}
          </span>
          {hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 opacity-60 transition hover:bg-[#161616] hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Akcje projektu ${project.name}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edytuj
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(project)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>Postęp</span>
          <span className="tabular-nums text-zinc-300">{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#161616]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progressPct))}%`,
              backgroundColor: project.color,
            }}
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[#161616] pt-3">
        <Stat label="Godziny" value={`${Math.round(hoursLogged)}h`} />
        <Stat
          label="Budżet"
          value={budget > 0 ? `${Math.round(budgetUtilization * 100)}%` : '—'}
          danger={isAtRisk}
        />
        <Stat label="Termin" value={formatDue(dueDate)} danger={isAtRisk} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-6 w-6 border border-[#1a1a1a]">
            <AvatarFallback
              className="text-[10px] font-semibold text-white"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-[11.5px] text-zinc-400">{clientName}</span>
        </div>
        {budget > 0 && (
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
            {formatCurrency(budget, 'PLN')}
          </span>
        )}
      </div>
    </li>
  )
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-[12.5px] font-semibold tabular-nums text-white',
          danger && 'text-rose-300',
        )}
      >
        {value}
      </p>
    </div>
  )
}
