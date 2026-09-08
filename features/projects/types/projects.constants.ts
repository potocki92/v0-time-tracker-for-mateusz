import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  type Project,
} from '@/lib/types'
import type { ProjectPriority, ProjectStatus, ProjectStatusFilter } from './projects.types'

export const PROJECT_STATUS_FILTER_OPTIONS: Array<{ value: ProjectStatusFilter; label: string }> = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'completed', label: 'Zakończone' },
  { value: 'planned', label: 'Zaplanowane' },
]

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
]

export const PROJECT_PRIORITY_OPTIONS: ProjectPriority[] = ['low', 'medium', 'high']

export const PROJECT_BUDGET_OPTIONS: Project['budget_type'][] = ['hourly', 'fixed', 'per_unit']

export const PROJECT_BUDGET_LABELS: Record<Project['budget_type'], string> = {
  hourly: 'Godzinowy',
  fixed: 'Ryczałtowy',
  per_unit: 'Za jednostkę',
}

export const PROJECT_COLOR_OPTIONS = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#64748b',
] as const

/**
 * Linear-style dark palette — kept in sync with features/dashboard so the
 * Projects module visually merges with the rest of the app.
 *
 * Etykiety biorą się z @/lib/types, żeby lista i formularz projektu nie
 * pokazywały dwóch różnych nazw tego samego statusu.
 *
 * `in_progress` jest celowo mocniejszy (wypełnienie /20 zamiast /15) — to
 * jedyny status, który użytkownik skanuje wzrokiem na liście.
 */
export const PROJECT_STATUS_PILL: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  planned: {
    label: PROJECT_STATUS_LABELS.planned,
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  },
  in_progress: {
    label: PROJECT_STATUS_LABELS.in_progress,
    className: 'bg-positive-500/20 text-positive-300 ring-1 ring-positive-500/40',
  },
  completed: {
    label: PROJECT_STATUS_LABELS.completed,
    className: 'bg-info-500/10 text-info-300/80 ring-1 ring-info-500/20',
  },
  on_hold: {
    label: PROJECT_STATUS_LABELS.on_hold,
    className: 'bg-warning-500/15 text-warning-300 ring-1 ring-warning-500/30',
  },
}

export const PROJECT_PRIORITY_PILL: Record<
  ProjectPriority,
  { label: string; className: string }
> = {
  low: {
    label: PRIORITY_LABELS.low,
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  },
  medium: {
    label: PRIORITY_LABELS.medium,
    className: 'bg-special-500/15 text-special-300 ring-1 ring-special-500/30',
  },
  high: {
    label: PRIORITY_LABELS.high,
    className: 'bg-danger-500/15 text-danger-300 ring-1 ring-danger-500/30',
  },
}

/**
 * Liczba mnoga do nagłówków grup na liście — `PROJECT_STATUS_LABELS`
 * opisuje pojedynczy projekt („Zakończony”), a nagłówek zbiera ich kilka.
 */
export const PROJECT_STATUS_GROUP_LABELS: Record<ProjectStatus, string> = {
  planned: 'Zaplanowane',
  in_progress: 'W trakcie',
  completed: 'Zakończone',
  on_hold: 'Wstrzymane',
}

/**
 * Wartości CSS, nie klasy — trafiają do `style.backgroundColor` pasków postępu.
 * Zmienne, nie heksy: heks nie zna motywu ani schematu, więc pasek był jedynym
 * elementem karty, który nie reagował na zmianę wyglądu aplikacji.
 */
export const PROJECT_STATUS_ACCENT: Record<ProjectStatus, string> = {
  planned: 'var(--rail)',
  in_progress: 'var(--positive-500)',
  completed: 'var(--info-500)',
  on_hold: 'var(--warning-500)',
}

export const FEATURED_DEFAULT_TARGET_HOURS = 580

/**
 * Used by the budget utilisation card to highlight projects that
 * already burnt > X% of the contracted budget.
 */
export const BUDGET_OVERSPEND_THRESHOLD = 1
export const BUDGET_WARNING_THRESHOLD = 0.8

/**
 * Kolor paska postępu. Wcześniej pasek malował się na `project.color`, który
 * jest losowany przy tworzeniu projektu — najbardziej nasycony element ekranu
 * nie niósł żadnej informacji. Teraz hue = stan projektu, a `project.color`
 * został tożsamością (lewa szyna karty).
 */
export function progressAccentOf(
  status: ProjectStatus,
  isAtRisk: boolean,
  budgetUtilization: number,
): string {
  if (status === 'in_progress') {
    if (budgetUtilization >= BUDGET_OVERSPEND_THRESHOLD) return 'var(--danger-500)'
    if (isAtRisk) return 'var(--warning-500)'
  }
  return PROJECT_STATUS_ACCENT[status]
}
