import type { ContractorBlock, WeeklySummary } from '@/features/dashboard/lib/weekly-summary'
import { formatDate, formatHours, formatRate, formatTotals } from './presentation'

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
