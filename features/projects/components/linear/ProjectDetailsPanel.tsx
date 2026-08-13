'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { clientInitials } from '@/components/common/ClientDisplay'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  PROJECT_BUDGET_LABELS,
  PROJECT_PRIORITY_PILL,
  PROJECT_STATUS_PILL,
  progressAccentOf,
} from '../../types/projects.constants'
import type { ProjectListRow as ProjectListRowType } from '../../types/projects.types'
import { LINEAR } from './linear.tokens'

type ProjectDetailsPanelProps = {
  row: ProjectListRowType
  onEdit: () => void
  onDelete: () => void
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ProjectDetailsPanel({ row, onEdit, onDelete }: ProjectDetailsPanelProps) {
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
  const accent = progressAccentOf(project.status, isAtRisk, budgetUtilization)

  return (
    <section className={cn('rounded-2xl border p-4 sm:p-5', LINEAR.border, LINEAR.surface)}>
      <header className="flex items-center justify-between gap-3">
        <p className={LINEAR.eyebrow}>PROJEKT</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
              statusPill.className,
            )}
          >
            {statusPill.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
              priorityPill.className,
            )}
          >
            {priorityPill.label}
          </span>
        </div>
      </header>

      <div className="mt-2">
        <h3 className="text-[20px] font-semibold text-white">{project.name}</h3>
        {project.description && (
          <p className="mt-0.5 text-[12px] text-zinc-400">{project.description}</p>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Postęp</span>
          <span className="tabular-nums text-zinc-200">{Math.round(progressPct)}%</span>
        </div>
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full', LINEAR.track)}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progressPct))}%`,
              backgroundColor: accent,
            }}
            aria-hidden
          />
        </div>
      </div>

      <div className={cn('mt-4 flex items-center gap-2 rounded-xl border p-3', LINEAR.border, LINEAR.surfaceElevated)}>
        <Avatar className={cn('h-7 w-7 border', LINEAR.border)}>
          <AvatarFallback
            className="text-[11px] font-semibold text-white"
            style={{ backgroundColor: clientColor }}
          >
            {clientInitials(clientName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            KLIENT
          </p>
          <p className="truncate text-[13px] font-medium text-zinc-100">{clientName}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        <DetailField label="START" value={formatDate(project.start_date)} />
        <DetailField label="TERMIN" value={formatDate(dueDate)} danger={isAtRisk} />
        <DetailField label="TYP BUDŻETU" value={PROJECT_BUDGET_LABELS[project.budget_type]} />
        <DetailField label="GODZINY" value={`${Math.round(hoursLogged)}h`} />
      </dl>

      <div className={cn('mt-4 rounded-xl border p-3', LINEAR.border, LINEAR.surfaceElevated)}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          BUDŻET
        </p>
        <div className="mt-2 space-y-1.5 text-[12.5px]">
          <Row
            label="Kwota"
            value={budget > 0 ? formatCurrency(budget, 'PLN') : '—'}
            mute={budget <= 0}
          />
          <Row
            label="Wykorzystanie"
            value={budget > 0 ? `${Math.round(budgetUtilization * 100)}%` : '—'}
            mute={budget <= 0}
            danger={isAtRisk}
          />
        </div>
      </div>

      {project.address && (
        <div className={cn('mt-3 rounded-xl border p-3', LINEAR.border, LINEAR.surfaceElevated)}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            ADRES
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-zinc-100">{project.address}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onEdit}
        className={cn(
          'mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[13px] font-semibold text-white transition',
          LINEAR.border,
          LINEAR.surfaceElevated,
          'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
        )}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Edytuj projekt
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-transparent text-[12px] font-medium text-zinc-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Usuń projekt
      </button>
    </section>
  )
}

function DetailField({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-3', LINEAR.border, LINEAR.surfaceElevated)}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 truncate text-[13px] font-medium text-zinc-100',
          danger && 'text-rose-300',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  mute,
  danger,
}: {
  label: string
  value: string
  mute?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span
        className={cn(
          'tabular-nums text-zinc-200',
          mute && 'text-zinc-500',
          danger && !mute && 'text-rose-300',
        )}
      >
        {value}
      </span>
    </div>
  )
}
