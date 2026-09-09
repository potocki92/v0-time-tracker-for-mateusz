import type { AppFormat } from '@/lib/format'
import { format as formatMoneyValue, isPositive } from '@/lib/finance/money'
import type { AppliedRate, ContractorBlock } from '../../../lib/weekly-summary'

/** Klucz `YYYY-MM-DD` → `DD.MM.YYYY`. */
export function formatDate(fmt: AppFormat, key: string): string {
  return fmt.date(key, 'short')
}

export function formatHours(fmt: AppFormat, hours: number): string {
  return fmt.hours(hours)
}

export function formatRate(fmt: AppFormat, rate: AppliedRate): string {
  const per = rate.workType === 'piecework' ? rate.unit ?? 'szt.' : 'h'
  return `${formatMoneyValue(fmt, { amountMinor: BigInt(Math.round(rate.rate * 100)), currency: rate.currency })}/${per}`
}

/** Kwota do rozliczenia kontrahenta (PLN i/lub EUR). */
export function formatTotals(fmt: AppFormat, block: ContractorBlock): string {
  const parts: string[] = []
  if (isPositive(block.totals.PLN)) parts.push(formatMoneyValue(fmt, block.totals.PLN))
  if (isPositive(block.totals.EUR)) parts.push(formatMoneyValue(fmt, block.totals.EUR))
  return parts.join(' · ') || formatMoneyValue(fmt, block.totals.PLN)
}
