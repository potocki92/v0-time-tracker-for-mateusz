import type { StatusVisualConfig, WorkStatus } from './calendar.types'

export const DEFAULT_ENTRY_HOURS = 8

/**
 * Spójny system kolorów statusów — użyty wszędzie w module kalendarza.
 * Każdy wariant (border, bg, pill, badge) trzyma w jednym miejscu całą "skórę"
 * statusu, żeby inne komponenty nie musiały znać klas Tailwinda.
 */
export const STATUS_CONFIG: Record<WorkStatus, StatusVisualConfig> = {
  worked: {
    label: 'Pracowałem',
    dot: 'bg-positive-500',
    border: 'border-l-positive-500',
    bg: 'hover:bg-positive-500/5',
    pill: 'bg-positive-500/10 text-positive-700 dark:text-positive-400',
    badge: 'bg-positive-500/15 text-positive-700 dark:text-positive-400 border-positive-500/30',
  },
  not_worked: {
    label: 'Nie pracowałem',
    dot: 'bg-danger-500',
    border: 'border-l-danger-500',
    bg: 'hover:bg-danger-500/5',
    pill: 'bg-danger-500/10 text-danger-700 dark:text-danger-400',
    badge: 'bg-danger-500/15 text-danger-700 dark:text-danger-400 border-danger-500/30',
  },
  vacation: {
    label: 'Urlop',
    dot: 'bg-special-500',
    border: 'border-l-special-500',
    bg: 'hover:bg-special-500/5',
    pill: 'bg-special-500/10 text-special-700 dark:text-special-400',
    badge: 'bg-special-500/15 text-special-700 dark:text-special-400 border-special-500/30',
  },
  sick_leave: {
    label: 'L4',
    dot: 'bg-warning-500',
    border: 'border-l-warning-500',
    bg: 'hover:bg-warning-500/5',
    pill: 'bg-warning-500/10 text-warning-700 dark:text-warning-400',
    badge: 'bg-warning-500/15 text-warning-700 dark:text-warning-400 border-warning-500/30',
  },
  day_off: {
    label: 'Dzień wolny',
    dot: 'bg-zinc-400',
    border: 'border-l-zinc-400',
    bg: 'hover:bg-zinc-500/5',
    pill: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  },
}

export const WORK_STATUS_ORDER: WorkStatus[] = [
  'worked',
  'not_worked',
  'vacation',
  'sick_leave',
  'day_off',
]
