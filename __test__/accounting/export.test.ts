import { describe, expect, it } from 'vitest'
import plAccounting from '@/messages/pl/accounting.json'
import deAccounting from '@/messages/de/accounting.json'
import enAccounting from '@/messages/en/accounting.json'
import {
  buildStatementCsv,
  buildStatementModel,
  formatPartyAddress,
  statementFileName,
  type AccountingDataset,
  type StatementDocumentLabels,
} from '@/features/accounting/domain'

/**
 * Kontrakt miedzy plikami wiadomosci a szablonami dokumentu.
 *
 * Przypisanie jest sprawdzane przez TypeScript, wiec usuniecie klucza
 * z `messages/<locale>/accounting.json` wywraca typecheck, a nie dopiero
 * wygenerowany PDF. Komplet kluczy miedzy jezykami pilnuje
 * `__test__/i18n/messages.test.ts`.
 */
const LABELS: Record<'pl' | 'de' | 'en', StatementDocumentLabels> = {
  pl: plAccounting.document,
  de: deAccounting.document,
  en: enAccounting.document,
}

const RANGE = { start: '2025-01-01', end: '2025-12-31' }

const dataset: AccountingDataset = {
  range: RANGE,
  workWindow: RANGE,
  invoices: [
    {
      id: 'i1',
      client_id: 'c1',
      invoice_number: 'FV/A/2025/03/1',
      recipient: 'Ignor Bau GmbH & Co. KG',
      description: 'Prace budowlane',
      issue_date: null,
      invoice_date: '2025-03-31',
      due_date: '2025-04-07',
      period_start: '2025-03-01',
      period_end: '2025-03-31',
      amount: 1230,
      net_amount: 1000,
      vat_amount: 230,
      gross_amount: 1230,
      currency: 'EUR',
      is_paid: true,
      paid_date: '2025-04-03',
      status: 'PAID',
    },
  ],
  entries: [
    {
      id: 'e1',
      client_id: 'c1',
      project_id: 'p1',
      date: '2025-03-10',
      status: 'worked',
      entry_kind: 'real',
      hours: 8,
    },
  ],
  clients: [
    {
      id: 'c1',
      name: 'Ignor Bau GmbH',
      nip: 'DE123456789',
      address: 'Hans-Boeckler-Str. 284',
      city: 'Koeln',
      postal_code: '50354',
      country_code: 'DE',
    },
  ],
  projects: [{ id: 'p1', name: 'Rohbau', client_id: 'c1', address: 'Im Winkel 51' }],
}

const model = buildStatementModel(dataset, '2026-03-01')

describe('CSV wykazu', () => {
  const csv = buildStatementCsv(model, LABELS.pl)
  const lines = csv.split('\n')

  it('zaczyna sie od BOM — bez niego Excel czyta UTF-8 jako ANSI', () => {
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('rozdziela srednikiem, a pole ze srednikiem w tresci cytuje', () => {
    expect(lines[0].split(';')).toHaveLength(17)

    const withSeparator = buildStatementModel(
      {
        ...dataset,
        invoices: [{ ...dataset.invoices[0], recipient: 'Ignor Bau GmbH; Sp. z o.o.' }],
      },
      '2026-03-01',
    )
    expect(buildStatementCsv(withSeparator, LABELS.pl)).toContain(
      '"Ignor Bau GmbH; Sp. z o.o."',
    )
  })

  it('jest plikiem maszynowym: daty ISO i kwoty z kropka, bez separatora tysiecy', () => {
    const cells = lines[1].split(';')
    expect(cells[1]).toBe('2025-03-31')
    expect(cells[2]).toBe('2025-03-01')
    expect(cells[3]).toBe('2025-03-31')
    expect(cells.slice(11, 14)).toEqual(['1000.00', '230.00', '1230.00'])
  })

  it('niesie odpowiedzi na „dla kogo" i „gdzie"', () => {
    const cells = lines[1].split(';')
    expect(cells[4]).toBe('Ignor Bau GmbH & Co. KG')
    expect(cells[5]).toBe('Hans-Boeckler-Str. 284, 50354 Koeln, DE')
    expect(cells[6]).toBe('DE123456789')
    expect(lines[1]).toContain('Im Winkel 51 (2025-03-10..2025-03-10, 1)')
  })

  it('konczy sie wierszem sumy per waluta', () => {
    const last = lines[lines.length - 1].split(';')
    expect(last[0]).toBe(LABELS.pl.totals.row)
    expect(last[13]).toBe('1230.00')
    expect(last[14]).toBe('EUR')
  })

  it('naglowki ida za JEZYKIEM DOKUMENTU, a nie za jezykiem panelu', () => {
    expect(buildStatementCsv(model, LABELS.de).split('\n')[0]).toContain('Rechnungsnummer')
    expect(buildStatementCsv(model, LABELS.en).split('\n')[0]).toContain('Invoice number')
  })
})

describe('adres nabywcy', () => {
  it('sklada ulice, kod z miastem i kraj, pomijajac puste czlony', () => {
    expect(formatPartyAddress(model.rows[0])).toBe('Hans-Boeckler-Str. 284, 50354 Koeln, DE')
    expect(
      formatPartyAddress({
        ...model.rows[0],
        party: { ...model.rows[0].party, address: null, postalCode: null },
      }),
    ).toBe('Koeln, DE')
  })
})

describe('nazwa pliku', () => {
  it('niesie zakres, zeby dwa wykazy nie nadpisaly sie w folderze pobranych', () => {
    expect(statementFileName(LABELS.pl.fileName, model, 'pdf')).toBe(
      'wykaz-faktur_2025-01-01_2025-12-31.pdf',
    )
    expect(statementFileName(LABELS.de.fileName, model, 'csv')).toBe(
      'rechnungsaufstellung_2025-01-01_2025-12-31.csv',
    )
  })
})
