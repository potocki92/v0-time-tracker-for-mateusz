import type {
  Project,
} from '@/lib/types'
import type { ProjectPriority, ProjectStatus, ProjectStatusFilter } from './projects.types'

export const PROJECT_STATUS_FILTER_OPTIONS: Array<{ value: ProjectStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'planned', label: 'Planned' },
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

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  on_hold: 'On hold',
}

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/**
 * Linear-style dark palette — kept in sync with features/dashboard so the
 * Projects module visually merges with the rest of the app.
 */
export const PROJECT_STATUS_PILL: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  planned: {
    label: 'Planned',
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  },
  in_progress: {
    label: 'In progress',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  },
  on_hold: {
    label: 'On hold',
    className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  },
}

export const PROJECT_PRIORITY_PILL: Record<
  ProjectPriority,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30',
  },
  high: {
    label: 'High',
    className: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  },
}

export const PROJECT_STATUS_ACCENT: Record<ProjectStatus, string> = {
  planned: '#71717a',
  in_progress: '#10b981',
  completed: '#3b82f6',
  on_hold: '#f59e0b',
}

export const FEATURED_DEFAULT_TARGET_HOURS = 580

/**
 * Used by the budget utilisation card to highlight projects that
 * already burnt > X% of the contracted budget.
 */
export const BUDGET_OVERSPEND_THRESHOLD = 1
export const BUDGET_WARNING_THRESHOLD = 0.8
