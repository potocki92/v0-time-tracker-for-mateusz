'use client'

import { clientInitials } from '@/components/common/ClientDisplay'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  PROJECT_PRIORITY_PILL,
  PROJECT_STATUS_PILL,
  progressAccentOf,
} from '../../types/projects.constants'
import type { ProjectListRow as ProjectListRowType } from '../../types/projects.types'
import { LINEAR } from './linear.tokens'

type ProjectListRowProps = {
  row: ProjectListRowType
  onSelect?: () => void
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Dla projektów w trakcie bliski termin czyta się szybciej jako „za 3 dni”
 * niż jako pełna data. Zakończone dostają zwykłą datę — „po terminie” przy
 * skończonej robocie byłoby fałszywym alarmem.
 */
function formatDeadline(
  date: string | null,
  isActive: boolean,
): { text: string; urgent: boolean } | null {
  if (!date) return null
  const time = new Date(date).getTime()
  if (Number.isNaN(time)) return null
  if (!isActive) return { text: formatDate(date), urgent: false }

  const days = Math.ceil((time - Date.now()) / MS_PER_DAY)
  if (days < 0) return { text: 'Po terminie', urgent: true }
  if (days === 0) return { text: 'Dziś', urgent: true }
  if (days === 1) return { text: 'Jutro', urgent: true }
  if (days <= 7) return { text: `Za ${days} dni`, urgent: true }
  return { text: formatDate(date), urgent: false }
}

export function ProjectListRow({ row, onSelect }: ProjectListRowProps) {
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
  const isActive = project.status === 'in_progress'
  const isDone = project.status === 'completed'
  const accent = progressAccentOf(project.status, isAtRisk, budgetUtilization)
  const deadline = formatDeadline(dueDate, isActive)

  const stats: Array<{ label: string; value: string; danger?: boolean }> = [
    { label: 'Godziny', value: `${Math.round(hoursLogged)} h` },
  ]
  if (budget > 0) {
    stats.push({
      label: 'Budżet',
      value: `${Math.round(budgetUtilization * 100)}%`,
      danger: isAtRisk,
    })
  }
  if (deadline) {
    stats.push({ label: 'Termin', value: deadline.text, danger: deadline.urgent })
  }

  return (
    <li
      className={cn(
        'group relative overflow-hidden rounded-xl border py-3.5 pl-5 pr-3.5 transition',
        LINEAR.rowSurface,
        isActive
          ? 'border-emerald-500/25 ring-1 ring-emerald-500/15'
          : cn(LINEAR.borderInset, 'hover:border-zinc-700/60'),
        // Kliknięcie w kartę obsługuje nakładka poniżej — treść musi być
        // przezroczysta dla kursora, żeby nie przechwytywała kliknięć.
        onSelect && 'pointer-events-none',
      )}
    >
      {/* Szyna stanu. Wcześniej brała losowany project.color — osiem różnych
          barw w kolumnie czytało się jak dekoracja, nie jak informacja. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          isActive ? 'bg-emerald-500 shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_45%,transparent)]' : LINEAR.rail,
        )}
      />

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Szczegóły projektu ${project.name}`}
          className="pointer-events-auto absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'line-clamp-2 text-sm font-semibold leading-snug',
              isDone ? 'text-zinc-300' : 'text-white',
            )}
          >
            {project.name}
          </p>
          {project.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-zinc-400">{project.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
              statusPill.className,
            )}
          >
            {statusPill.label}
          </span>
          {/* Tylko wysoki priorytet — „Średni” na każdym wierszu to szum. */}
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
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-2xs text-zinc-400">
          <span>Postęp</span>
          <span className="tabular-nums text-zinc-200">{Math.round(progressPct)}%</span>
        </div>
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full', LINEAR.track)}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, progressPct))}%`,
              backgroundColor: accent,
              // Skończona praca cofa się w tło — świeci tylko to, co trwa.
              opacity: isDone ? 0.45 : 1,
            }}
            aria-hidden
          />
        </div>
      </div>

      <div
        className={cn(
          'mt-3 grid gap-3 border-t pt-3',
          LINEAR.borderInset,
          stats.length === 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-1',
        )}
      >
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} danger={stat.danger} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className={cn('h-6 w-6 border', LINEAR.border)}>
            <AvatarFallback
              className="text-2xs font-semibold text-white"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials(clientName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-zinc-300">{clientName}</span>
        </div>
        {budget > 0 && (
          <span className="shrink-0 text-2xs tabular-nums text-zinc-400">
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
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-xs font-semibold tabular-nums text-white',
          danger && 'text-rose-300',
        )}
      >
        {value}
      </p>
    </div>
  )
}
