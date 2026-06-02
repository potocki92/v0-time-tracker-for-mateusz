import { format as formatMoney, isPositive } from '@/lib/finance/money'
import type { AppliedRate, ContractorBlock, WeeklySummary } from '@/features/dashboard/lib/weekly-summary'

function formatDate(key: string): string {
  const [y, m, d] = key.split('-')
  return `${d}.${m}.${y}`
}

function formatHours(hours: number): string {
  return `${hours.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} h`
}

function formatRate(rate: AppliedRate): string {
  const per = rate.workType === 'piecework' ? rate.unit ?? 'szt.' : 'h'
  return `${rate.rate.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} ${rate.currency}/${per}`
}

function formatTotals(block: ContractorBlock): string {
  const parts: string[] = []
  if (isPositive(block.totals.PLN)) parts.push(formatMoney(block.totals.PLN))
  if (isPositive(block.totals.EUR)) parts.push(formatMoney(block.totals.EUR))
  return parts.join(' · ') || formatMoney(block.totals.PLN)
}

function formatBlock(block: ContractorBlock): string {
  const lines: string[] = [block.clientName]
  if (block.client?.nip) lines.push(`NIP: ${block.client.nip}`)
  const address = [block.client?.address, [block.client?.postal_code, block.client?.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  if (address) lines.push(address)

  lines.push(`Dni pracy: ${formatDate(block.workedFrom)} – ${formatDate(block.workedTo)} (${block.workedDaysCount} dni)`)
  lines.push(`Godziny: ${formatHours(block.totalHours)}`)
  lines.push(`Stawka na fakturze: ${block.rates.map(formatRate).join(', ')}`)
  lines.push(`Do rozliczenia: ${formatTotals(block)}`)
  return lines.join('\n')
}

/** Sformatowany tekst raportu gotowy do wklejenia w wiadomość do księgowej. */
export function formatWeeklySummaryText(summary: WeeklySummary): string {
  const header = `Podsumowanie tygodnia KW ${summary.weekNumber}/${summary.weekYear} (${summary.rangeLabel})`
  if (summary.isEmpty) return `${header}\n\nBrak przepracowanych dni w tym tygodniu.`
  return [header, '', summary.contractors.map(formatBlock).join('\n\n')].join('\n')
}
