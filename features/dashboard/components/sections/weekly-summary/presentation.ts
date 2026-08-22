import { formatDate as formatIsoDate, formatHours as formatIsoHours } from '@/lib/format'
import { format as formatMoneyValue, isPositive } from '@/lib/finance/money'
import type { AppliedRate, ContractorBlock } from '../../../lib/weekly-summary'

/** Klucz `YYYY-MM-DD` → `DD.MM.YYYY`. */
export function formatDate(key: string): string {
  return formatIsoDate(key, 'short')
}

export function formatHours(hours: number): string {
  return formatIsoHours(hours)
}

export function formatRate(rate: AppliedRate): string {
  const per = rate.workType === 'piecework' ? rate.unit ?? 'szt.' : 'h'
  return `${formatMoneyValue({ amountMinor: BigInt(Math.round(rate.rate * 100)), currency: rate.currency })}/${per}`
}

/** Kwota do rozliczenia kontrahenta (PLN i/lub EUR). */
export function formatTotals(block: ContractorBlock): string {
  const parts: string[] = []
  if (isPositive(block.totals.PLN)) parts.push(formatMoneyValue(block.totals.PLN))
  if (isPositive(block.totals.EUR)) parts.push(formatMoneyValue(block.totals.EUR))
  return parts.join(' · ') || formatMoneyValue(block.totals.PLN)
}
