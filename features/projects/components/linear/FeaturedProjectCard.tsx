'use client'

import type { ReactNode } from 'react'
import { Pencil, Pin } from 'lucide-react'
import { clientInitials } from '@/components/common/ClientDisplay'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/helpers'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  PROJECT_PRIORITY_PILL,
  PROJECT_STATUS_PILL,
  progressAccentOf,
} from '../../types/projects.constants'
import type { FeaturedProject } from '../../types/projects.types'
import { LINEAR } from './linear.tokens'

type FeaturedProjectCardProps = {
  featured: FeaturedProject
  onEdit?: (project: Project) => void
}

function formatStartedAt(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function FeaturedProjectCard({ featured, onEdit }: FeaturedProjectCardProps) {
  const { project, clientName, progressPct, hoursLogged, hoursTarget, budget, budgetSpent, budgetUtilization, tasksDone, tasksTotal, isAtRisk } = featured
  const statusPill = PROJECT_STATUS_PILL[project.status]
  const accent = progressAccentOf(project.status, isAtRisk, budgetUtilization)
  const isOverHours = hoursTarget !== null && hoursLogged > hoursTarget

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        LINEAR.border,
        LINEAR.surface,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}99, transparent)` }}
      />

      <header className={cn('flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5', LINEAR.borderInset)}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
              'bg-[#17171a] text-zinc-200 ring-1 ring-[#2a2a30]',
            )}
          >
            <Pin className="h-3 w-3" aria-hidden />
            Wyróżniony
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
              statusPill.className,
            )}
          >
            {statusPill.label}
          </span>
          {project.priority === 'high' && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
                PROJECT_PRIORITY_PILL.high.className,
              )}
            >
              {PROJECT_PRIORITY_PILL.high.label}
            </span>
          )}
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(project)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-white transition',
              LINEAR.border,
              LINEAR.surfaceElevated,
              'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
            )}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edytuj
          </button>
        )}
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {clientName}
            {project.start_date && ` · Start ${formatStartedAt(project.start_date)}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Postęp" value={`${Math.round(progressPct)}%`}>
            <div className={cn('mt-2 h-1.5 w-full overflow-hidden rounded-full', LINEAR.track)}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, progressPct))}%`,
                  backgroundColor: accent,
                }}
                aria-hidden
              />
            </div>
          </Metric>

          <Metric
            label="Godziny"
            value={hoursTarget ? `${Math.round(hoursLogged)} / ${hoursTarget}` : `${Math.round(hoursLogged)}`}
            meta={isOverHours ? 'Ponad plan' : undefined}
            warning={isOverHours}
          />

          <Metric
            label="Wykorzystany budżet"
            value={budget > 0 ? formatCurrency(budgetSpent, 'PLN') : '—'}
            meta={budget > 0 ? `z ${formatCurrency(budget, 'PLN')}` : 'Brak budżetu'}
            danger={budget > 0 && isAtRisk}
            empty={budget <= 0}
          />

          <Metric
            label="Zadania"
            value={tasksTotal > 0 ? `${tasksDone} / ${tasksTotal}` : '—'}
            meta={tasksTotal > 0 ? undefined : 'Brak zadań'}
            empty={tasksTotal <= 0}
          />
        </div>

        <div className={cn('flex items-center gap-2 border-t pt-3', LINEAR.borderInset)}>
          <Avatar className={cn('h-7 w-7 border', LINEAR.border)}>
            <AvatarFallback
              className="text-2xs font-semibold text-white"
              style={{ backgroundColor: project.color }}
            >
              {clientInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{clientName}</p>
            {project.description && (
              <p className="truncate text-2xs text-zinc-400">{project.description}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  meta,
  danger,
  warning,
  empty,
  children,
}: {
  label: string
  value: string
  meta?: string
  danger?: boolean
  /** Przekroczony cel — informacja, nie błąd. */
  warning?: boolean
  /** Brak danych: wygaszamy wartość, żeby „—” czytało się jako pusty stan, a nie awaria. */
  empty?: boolean
  children?: ReactNode
}) {
  return (
    <div className={cn('rounded-lg border px-3 py-2.5', LINEAR.borderInset, LINEAR.rowSurface)}>
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-base font-semibold tabular-nums tracking-tight text-white sm:text-lg',
          empty && 'text-zinc-600',
          warning && 'text-amber-300',
          danger && 'text-rose-300',
        )}
      >
        {value}
      </p>
      {meta && (
        <p className={cn('mt-0.5 text-2xs text-zinc-400', warning && 'text-amber-300/80')}>
          {meta}
        </p>
      )}
      {children}
    </div>
  )
}
