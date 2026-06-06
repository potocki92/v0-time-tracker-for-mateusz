import { format as formatMoney, isPositive } from '@/lib/finance/money'
import type { AppliedRate, ContractorBlock } from '@/features/dashboard/lib/weekly-summary'

/** Klucz `YYYY-MM-DD` → `DD.MM.YYYY`. */
export function formatDate(key: string): string {
  const [y, m, d] = key.split('-')
  return `${d}.${m}.${y}`
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} h`
}

export function formatRate(rate: AppliedRate): string {
  const per = rate.workType === 'piecework' ? rate.unit ?? 'szt.' : 'h'
  return `${rate.rate.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} ${rate.currency}/${per}`
}

/** Kwota do rozliczenia kontrahenta (PLN i/lub EUR). */
export function formatTotals(block: ContractorBlock): string {
  const parts: string[] = []
  if (isPositive(block.totals.PLN)) parts.push(formatMoney(block.totals.PLN))
  if (isPositive(block.totals.EUR)) parts.push(formatMoney(block.totals.EUR))
  return parts.join(' · ') || formatMoney(block.totals.PLN)
}
