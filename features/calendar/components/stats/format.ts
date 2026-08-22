import { formatCount } from '@/lib/format'

/** "1 dzień" / "2 dni" / "5 dni" — odmiana idzie przez Intl.PluralRules. */
export function countDays(count: number): string {
  return formatCount(count, ['dzień', 'dni', 'dni'])
}
