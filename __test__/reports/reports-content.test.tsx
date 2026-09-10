import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { describe, expect, it } from 'vitest'

import reports from '@/messages/pl/reports.json'
import { ReportsContent } from '@/features/reports'
import {
  fetchWindowOf,
  rangeOf,
  type ReportFilters,
  type ReportsDataset,
} from '@/features/reports/domain'
import { QUERY_KEYS } from '@/lib/query'
import {
  CLIENT_HOURLY_EUR,
  CLIENT_HOURLY_PLN,
  PROJECT_A,
  dataset,
  entry,
} from './fixtures'

/**
 * Test integracyjny raportu: dane siedza w cache React Query pod kluczem,
 * ktory sklada `useReportsQuery`, a nie w zamockowanym hooku.
 *
 * Dzieki temu test pilnuje ZLOZENIA calej sciezki — filtry z URL-a → okno →
 * klucz cache → model → sekcje UI. Podmieniony hook przepuscilby rozjechany
 * klucz, czyli dokladnie ten blad, ktory kosztuje drugie pobranie danych.
 */

const TODAY = '2026-09-30'

const DEFAULT_FILTERS: ReportFilters = {
  preset: 'last30d',
  from: '',
  to: '',
  clientId: 'all',
  projectId: 'all',
  tag: 'all',
  compare: false,
}

function seededClient(data: ReportsDataset, filters: ReportFilters = DEFAULT_FILTERS) {
  const window = fetchWindowOf(rangeOf(filters, TODAY), filters.compare)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  client.setQueryData(
    QUERY_KEYS.reports({
      from: window.start,
      to: window.end,
      clientId: filters.clientId,
      projectId: filters.projectId,
    }),
    data,
  )
  return client
}

function renderReports(data: ReportsDataset, searchParams = '') {
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <QueryClientProvider client={seededClient(data)}>
        <NextIntlClientProvider locale="pl" messages={{ reports }}>
          <ReportsContent today={TODAY} />
        </NextIntlClientProvider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  )
}

const section = (name: string) => screen.getByRole('region', { name })

const WORK = dataset([
  entry({ id: 'a', date: '2026-09-20', hours: 8, billing_rate: 100, tags: ['dev'] }),
  entry({
    id: 'b',
    date: '2026-09-21',
    client_id: CLIENT_HOURLY_EUR.id,
    project_id: null,
    hours: 2,
    billing_rate: 50,
    billing_currency: 'EUR',
  }),
])

describe('Reports — zlozenie strony', () => {
  it('pokazuje szesc kafelkow KPI policzonych z datasetu', () => {
    renderReports(WORK)

    const kpis = section(reports.kpi.sectionLabel)
    expect(within(kpis).getByText('10 h')).toBeTruthy()
    // 8 h x 100 PLN + 2 h x 50 EUR x 4 = 1 200 PLN
    expect(within(kpis).getByText(/1\s*200,00/)).toBeTruthy()
    expect(within(kpis).getByText('2')).toBeTruthy()
  })

  it('renderuje sekcje trendu, podzialu, rytmu i szczegolow', () => {
    renderReports(WORK)

    expect(section(reports.trend.sectionLabel)).toBeTruthy()
    expect(section(reports.breakdown.sectionLabel)).toBeTruthy()
    expect(section(reports.insights.sectionLabel)).toBeTruthy()
    expect(section(reports.table.sectionLabel)).toBeTruthy()
  })

  it('podzial startuje od klientow i przelacza sie na tagi', () => {
    renderReports(WORK)

    const breakdown = section(reports.breakdown.sectionLabel)
    expect(within(breakdown).getByText(CLIENT_HOURLY_PLN.name)).toBeTruthy()
    expect(within(breakdown).getByText(CLIENT_HOURLY_EUR.name)).toBeTruthy()

    fireEvent.click(within(breakdown).getByRole('button', { name: reports.breakdown.tag }))
    expect(within(breakdown).getByText('dev')).toBeTruthy()
    expect(within(breakdown).getByText(reports.breakdown.untagged)).toBeTruthy()
  })

  it('tabela szczegolowa pokazuje wpisy okresu', () => {
    renderReports(WORK)

    const table = within(section(reports.table.sectionLabel)).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(3) // naglowek + 2 wpisy
    expect(within(table).getByText(PROJECT_A.name)).toBeTruthy()
  })

  it('bez zadnego wpisu pokazuje pusty stan modulu, nie pusta tabele', () => {
    renderReports(dataset([]))

    expect(screen.getByText(reports.states.noEntriesTitle)).toBeTruthy()
    expect(screen.queryByRole('region', { name: reports.kpi.sectionLabel })).toBeNull()
  })

  it('filtry z URL-a odtwarzaja raport po odswiezeniu', () => {
    render(
      <NuqsTestingAdapter searchParams="?preset=custom&from=2026-09-20&to=2026-09-20">
        <QueryClientProvider
          client={seededClient(WORK, {
            ...DEFAULT_FILTERS,
            preset: 'custom',
            from: '2026-09-20',
            to: '2026-09-20',
          })}
        >
          <NextIntlClientProvider locale="pl" messages={{ reports }}>
            <ReportsContent today={TODAY} />
          </NextIntlClientProvider>
        </QueryClientProvider>
      </NuqsTestingAdapter>,
    )

    const kpis = section(reports.kpi.sectionLabel)
    expect(within(kpis).getByText('8 h')).toBeTruthy()
  })
})
