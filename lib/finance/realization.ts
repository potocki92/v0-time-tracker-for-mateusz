import type { WorkEntry } from '@/lib/types'

/**
 * Wpis "zrealizowany" = potwierdzony `real` z datą do dziś włącznie.
 * Reszta (wpisy `predicted` oraz przyszłe daty) to plan.
 * Definicja spójna z kalendarzem (selectCalendarStats).
 */
export function isRealizedEntry(
  entry: Pick<WorkEntry, 'entry_kind' | 'date'>,
  todayIso: string,
): boolean {
  return (entry.entry_kind ?? 'real') === 'real' && entry.date <= todayIso
}

export function partitionByRealization(
  entries: WorkEntry[],
  todayIso: string,
): { realized: WorkEntry[]; predicted: WorkEntry[] } {
  const realized: WorkEntry[] = []
  const predicted: WorkEntry[] = []
  for (const entry of entries) {
    if (isRealizedEntry(entry, todayIso)) realized.push(entry)
    else predicted.push(entry)
  }
  return { realized, predicted }
}
