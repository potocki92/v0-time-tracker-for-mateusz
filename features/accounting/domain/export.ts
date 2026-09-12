import { fromMinor, toDecimalString } from '@/lib/finance/money'
import type { CURRENCY } from '@/lib/types'
import type { StatementDocumentLabels } from './labels'
import type { StatementModel, StatementRow } from './types'

/**
 * Tresc eksportu CSV — czysta funkcja, zeby format dalo sie przetestowac bez
 * przegladarki. Hook dokleda tylko pobranie pliku i toast.
 *
 * CSV jest plikiem MASZYNOWYM, nie wydrukiem: daty ida w ISO, kwoty z kropka
 * dziesietna i bez separatora tysiecy, jeden wiersz na fakture. Dzieki temu
 * arkusz i program ksiegowy czytaja go tak samo, niezaleznie od tego, na jaki
 * jezyk ustawiony jest komputer ksiegowej. Do czytania oczami jest PDF.
 *
 * Separator to srednik, bo polski i niemiecki Excel otwiera przecinkowy CSV
 * jako jedna kolumne. BOM zostaje — bez niego Excel czyta UTF-8 jako ANSI
 * i rozbija polskie oraz niemieckie znaki w nazwach klientow.
 */

const SEPARATOR = ';'
const BOM = '﻿'

function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Grosze/centy → "1234.56". Kropka i zero separatorow, bo plik jest maszynowy. */
function money(minor: number, currency: CURRENCY): string {
  return toDecimalString(fromMinor(minor, currency))
}

/**
 * Adres nabywcy w jednej komorce: ulica, kod i miasto, kraj.
 * Puste czlony wypadaja, zeby nie zostawaly przecinki bez tresci.
 */
export function formatPartyAddress(row: StatementRow): string {
  const { address, postalCode, city, countryCode } = row.party
  const cityLine = [postalCode, city].filter(Boolean).join(' ')
  return [address, cityLine, countryCode].filter(Boolean).join(', ')
}

/**
 * Miejsca pracy w jednej komorce: "adres (od–do, N dni)", oddzielone `|`.
 * Rozbicie dzien po dniu jest w PDF — CSV ma sie zaimportowac, nie zastapic
 * dokumentu.
 */
function formatWorksites(row: StatementRow, labels: StatementDocumentLabels): string {
  if (row.worksites.length === 0) return ''

  return row.worksites
    .map((worksite) => {
      const place = worksite.location ?? worksite.projectName ?? labels.placeholders.noLocation
      return `${place} (${worksite.from}..${worksite.to}, ${worksite.workedDays})`
    })
    .join(' | ')
}

function csvRow(row: StatementRow, labels: StatementDocumentLabels): Array<string | number> {
  return [
    row.invoiceNumber,
    row.issueDate,
    row.period?.start ?? '',
    row.period?.end ?? '',
    row.party.name ?? '',
    formatPartyAddress(row),
    row.party.taxId ?? '',
    row.description ?? '',
    formatWorksites(row, labels),
    row.workedDays,
    row.hours,
    money(row.netMinor, row.currency),
    money(row.vatMinor, row.currency),
    money(row.grossMinor, row.currency),
    row.currency,
    labels.status[row.status],
    row.paidDate ?? '',
  ]
}

export function buildStatementCsv(
  model: StatementModel,
  labels: StatementDocumentLabels,
): string {
  const header = [
    labels.columns.invoiceNumber,
    labels.columns.issueDate,
    `${labels.columns.servicePeriod} — ${labels.columns.from}`,
    `${labels.columns.servicePeriod} — ${labels.columns.to}`,
    labels.columns.buyer,
    labels.columns.buyerAddress,
    labels.columns.taxId,
    labels.columns.description,
    labels.columns.location,
    labels.columns.workedDays,
    labels.columns.hours,
    labels.columns.net,
    labels.columns.vat,
    labels.columns.gross,
    labels.columns.currency,
    labels.columns.status,
    labels.columns.paidDate,
  ]

  // Wiersz sumy per waluta na koncu: arkusz otwarty bez formul ma od razu
  // pokazac kwoty, ktore ksiegowa przepisuje do zeznania.
  const totals = model.totals.map((total) => [
    labels.totals.row,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    money(total.netMinor, total.currency),
    money(total.vatMinor, total.currency),
    money(total.grossMinor, total.currency),
    total.currency,
    '',
    '',
  ])

  return (
    BOM +
    [header, ...model.rows.map((row) => csvRow(row, labels)), ...totals]
      .map((cells) => cells.map(escapeCsv).join(SEPARATOR))
      .join('\n')
  )
}

/** `wykaz-faktur_2026-01-01_2026-12-31.csv` — baza nazwy pochodzi z etykiet dokumentu. */
export function statementFileName(
  base: string,
  model: StatementModel,
  extension: string,
): string {
  return `${base}_${model.range.start}_${model.range.end}.${extension}`
}
