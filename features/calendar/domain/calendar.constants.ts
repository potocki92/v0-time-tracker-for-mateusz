import type { StatusVisualConfig, WorkStatus } from './calendar.types'

export const MONTHLY_BASELINE_HOURS = 160
export const DEFAULT_ENTRY_HOURS = 8

/**
 * Spójny system kolorów statusów — użyty wszędzie w module kalendarza.
 * Każdy wariant (border, bg, pill, badge) trzyma w jednym miejscu całą "skórę"
 * statusu, żeby inne komponenty nie musiały znać klas Tailwinda.
 */
export const STATUS_CONFIG: Record<WorkStatus, StatusVisualConfig> = {
  worked: {
    label: 'Pracowałem',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
    bg: 'hover:bg-emerald-500/5',
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  not_worked: {
    label: 'Nie pracowałem',
    dot: 'bg-rose-500',
    border: 'border-l-rose-500',
    bg: 'hover:bg-rose-500/5',
    pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    badge: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  vacation: {
    label: 'Urlop',
    dot: 'bg-violet-500',
    border: 'border-l-violet-500',
    bg: 'hover:bg-violet-500/5',
    pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  },
  sick_leave: {
    label: 'L4',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    bg: 'hover:bg-amber-500/5',
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  day_off: {
    label: 'Dzień wolny',
    dot: 'bg-slate-400',
    border: 'border-l-slate-400',
    bg: 'hover:bg-slate-500/5',
    pill: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
}

export const WORK_STATUS_ORDER: WorkStatus[] = [
  'worked',
  'not_worked',
  'vacation',
  'sick_leave',
  'day_off',
]

export const MONTH_ABBR = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
] as const
