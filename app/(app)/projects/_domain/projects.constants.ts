import type {
  ProjectBudgetType,
  ProjectPriority,
  ProjectStatus,
  ProjectStatusFilter,
} from './projects.types'

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

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
]

export const PROJECT_PRIORITY_OPTIONS: ProjectPriority[] = ['low', 'medium', 'high']

export const PROJECT_BUDGET_OPTIONS: ProjectBudgetType[] = ['hourly', 'fixed', 'per_unit']

export const PROJECT_BUDGET_LABELS: Record<ProjectBudgetType, string> = {
  hourly: 'Godzinowy',
  fixed: 'Ryczałtowy',
  per_unit: 'Za jednostkę',
}

export const PROJECT_STATUS_FILTER_OPTIONS: { value: ProjectStatusFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'in_progress', label: 'W trakcie' },
  { value: 'planned', label: 'Planowane' },
  { value: 'on_hold', label: 'Wstrzymane' },
  { value: 'completed', label: 'Zakończone' },
]

export const PROJECT_STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  planned: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  on_hold: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
}

export const PROJECT_PRIORITY_BADGE_CLASS: Record<ProjectPriority, string> = {
  low: 'bg-muted text-muted-foreground border-transparent',
  medium: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  high: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
}
