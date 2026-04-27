'use client'

import type { ReactNode } from 'react'
import { Pin, Play } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { PROJECT_PRIORITY_PILL, PROJECT_STATUS_PILL } from '../../types/projects.constants'
import type { FeaturedProject } from '../../types/projects.types'
import { LINEAR } from './linear.tokens'

type FeaturedProjectCardProps = {
  featured: FeaturedProject
  onTrack?: (projectId: string) => void
}

function formatStartedAt(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function clientInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function FeaturedProjectCard({ featured, onTrack }: FeaturedProjectCardProps) {
  const { project, clientName, progressPct, hoursLogged, hoursTarget, budget, budgetSpent, tasksDone, tasksTotal, isAtRisk } = featured
  const statusPill = PROJECT_STATUS_PILL[project.status]
  const priorityPill = PROJECT_PRIORITY_PILL[project.priority]

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
        style={{ background: `linear-gradient(90deg, transparent, ${project.color}99, transparent)` }}
      />

      <header className="flex items-start justify-between gap-3 border-b border-[#161616] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              'bg-[#101010] text-zinc-200 ring-1 ring-[#1a1a1a]',
            )}
          >
            <Pin className="h-3 w-3" aria-hidden />
            Featured
          </span>
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
        </div>

        {onTrack && (
          <button
            type="button"
            onClick={() => onTrack(project.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-white transition',
              LINEAR.border,
              LINEAR.surfaceElevated,
              'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
            )}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Track
          </button>
        )}
      </header>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {project.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {clientName}
            {project.start_date && ` · Started ${formatStartedAt(project.start_date)}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Progress" value={`${Math.round(progressPct)}%`}>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#161616]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, progressPct))}%`,
                  backgroundColor: project.color,
                }}
                aria-hidden
              />
            </div>
          </Metric>

          <Metric
            label="Hours"
            value={hoursTarget ? `${Math.round(hoursLogged)} / ${hoursTarget}` : `${Math.round(hoursLogged)}`}
          />

          <Metric
            label="Budget used"
            value={budget > 0 ? formatCurrency(budgetSpent, 'PLN') : '—'}
            meta={budget > 0 ? `of ${formatCurrency(budget, 'PLN')}` : undefined}
            danger={isAtRisk}
          />

          <Metric
            label="Tasks"
            value={tasksTotal > 0 ? `${tasksDone} / ${tasksTotal}` : '—'}
          />
        </div>

        <div className="flex items-center gap-2 border-t border-[#161616] pt-3">
          <Avatar className="h-7 w-7 border border-[#1a1a1a]">
            <AvatarFallback
              className="text-[11px] font-semibold text-white"
              style={{ backgroundColor: project.color }}
            >
              {clientInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-white">{clientName}</p>
            {project.description && (
              <p className="truncate text-[11px] text-zinc-500">{project.description}</p>
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
  children,
}: {
  label: string
  value: string
  meta?: string
  danger?: boolean
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#161616] bg-[#0c0c0c] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-base font-semibold tabular-nums tracking-tight text-white sm:text-lg',
          danger && 'text-rose-300',
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-0.5 text-[11px] text-zinc-500">{meta}</p>}
      {children}
    </div>
  )
}
