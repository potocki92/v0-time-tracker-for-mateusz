import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { describe, expect, it } from 'vitest'

import accounting from '@/messages/pl/accounting.json'
import { StatementContent } from '@/features/accounting'
import {
  rangeOf,
  type AccountingDataset,
  type StatementFilters,
} from '@/features/accounting/domain'
import { QUERY_KEYS } from '@/lib/query'

/**
 * Test integracyjny wykazu: dane siedza w cache React Query pod kluczem, ktory
 * sklada `useAccountingQuery`, a nie w zamockowanym hooku.
 *
 * Dzieki temu test pilnuje ZLOZENIA calej sciezki — filtry z URL-a → zakres →
 * klucz cache → model → sekcje UI. Podmieniony hook przepuscilby rozjechany
 * klucz, czyli dokladnie ten blad, ktory kosztuje drugie pobranie danych.
 */

const TODAY = '2026-03-01'

const DEFAULT_FILTERS: StatementFilters = {
  preset: 'lastYear',
  from: '',
  to: '',
  clientId: 'all',
  documentLocale: 'pl',
}

const DATASET: AccountingDataset = {
  range: { start: '2025-01-01', end: '2025-12-31' },
  workWindow: { start: '2025-01-01', end: '2025-12-31' },
  invoices: [
    {
      id: 'i1',
      client_id: 'c1',
      invoice_number: 'FV/A/2025/03/1',
      recipient: null,
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
    {
      id: 'i2',
      client_id: 'c1',
      invoice_number: 'FV/A/2025/06/1',
      recipient: null,
      description: null,
      issue_date: null,
      invoice_date: '2025-06-30',
      due_date: '2025-07-07',
      period_start: null,
      period_end: null,
      amount: 500,
      net_amount: 500,
      vat_amount: 0,
      gross_amount: 500,
      currency: 'EUR',
      is_paid: false,
      paid_date: null,
      status: 'SENT',
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

function seededClient(filters: StatementFilters = DEFAULT_FILTERS) {
  const range = rangeOf(filters, TODAY)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  client.setQueryData(
    QUERY_KEYS.accounting({
      from: range.start,
      to: range.end,
      clientId: filters.clientId,
    }),
    DATASET,
  )
  return client
}

function renderStatement(searchParams = '') {
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider client={seededClient()}>
        <NextIntlClientProvider locale="pl" messages={{ accounting }}>
          <StatementContent today={TODAY} />
        </NextIntlClientProvider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  )
}

const section = (name: string) => screen.getByRole('region', { name })

describe('Wykaz — zlozenie strony', () => {
  it('domyslny adres trafia w klucz cache poprzedniego roku', () => {
    renderStatement()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      accounting.header.title,
    )
    expect(screen.getAllByText('FV/A/2025/03/1').length).toBeGreaterThan(0)
  })

  it('rejestr pokazuje nabywce, okres uslugi i miejsce pracy', () => {
    renderStatement()
    const register = section(accounting.table.sectionLabel)

    expect(within(register).getAllByText('Ignor Bau GmbH').length).toBeGreaterThan(0)
    expect(within(register).getAllByText('DE123456789').length).toBeGreaterThan(0)
    expect(within(register).getAllByText('Im Winkel 51').length).toBeGreaterThan(0)
  })

  it('faktura bez okresu uslugi jest oznaczona luka, a nie data wystawienia', () => {
    renderStatement()
    const register = section(accounting.table.sectionLabel)

    expect(within(register).getAllByText(accounting.table.noPeriod).length).toBeGreaterThan(0)
  })

  it('ostrzega o lukach, zanim plik pojdzie do ksiegowej', () => {
    renderStatement()
    const warnings = section(accounting.warnings.title)

    expect(within(warnings).getByText(/1 faktura nie ma zapisanego okresu/)).toBeTruthy()
  })

  it('podsumowanie sumuje waluty osobno i rozdziela zaplacone od niezaplaconych', () => {
    renderStatement()
    const summary = section(accounting.summary.sectionLabel)

    expect(within(summary).getByText('EUR')).toBeTruthy()
    expect(within(summary).getByText(accounting.summary.currenciesNote)).toBeTruthy()
    // Dwie faktury, jedna zaplacona: podzial musi zostac widoczny osobno.
    expect(within(summary).getByText(/1\s*230,00/)).toBeTruthy()
  })

  it('jezyk dokumentu czyta sie z adresu i nie rusza jezyka interfejsu', () => {
    renderStatement('?lang=de')

    // Panel zostaje po polsku…
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
      accounting.header.title,
    )
    // …a przelacznik jezyka pliku wskazuje niemiecki.
    expect(screen.getByRole('button', { name: 'Deutsch' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
  })

  it('zakres z adresu sklada INNY klucz cache — wykaz nie pokazuje cudzych faktur', () => {
    // Inny preset to inny zakres, wiec inny klucz: w cache nie ma dla niego
    // datasetu i widok czeka na dane zamiast pokazac faktury poprzedniego roku.
    renderStatement('?preset=thisYear')

    expect(screen.getByTestId('section-skeleton')).toBeTruthy()
    expect(screen.queryByText('FV/A/2025/03/1')).toBeNull()
  })
})
