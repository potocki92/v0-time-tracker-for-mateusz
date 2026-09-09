import type { AppFormat } from '@/lib/format'

/**
 * "1 dzień" / "2 dni" / "5 dni".
 *
 * TODO(i18n): po migracji karty statystyk kalendarza ten helper znika na
 * rzecz komunikatu ICU `calendar.stats.days` — patrz `docs/i18n.md`.
 */
export function countDays(fmt: AppFormat, count: number): string {
  return fmt.count(count, ['dzień', 'dni', 'dni'])
}
