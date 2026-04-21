import type { Project } from './types'

export const statusStyles: Record<Project['status'], string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  archived: 'bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
}

export const statusLabels: Record<Project['status'], string> = {
  active: 'aktywny',
  completed: 'zakończony',
  archived: 'zarchiwizowany',
}

export function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0
  return Math.min(100, Math.max(0, progress))
}

export function formatUpdatedAt(updatedAt: Date): string {
  if (!(updatedAt instanceof Date) || Number.isNaN(updatedAt.getTime())) {
    return 'brak danych'
  }

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(updatedAt)
}
