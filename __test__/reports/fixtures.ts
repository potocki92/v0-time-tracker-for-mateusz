import type {
  ReportClientRef,
  ReportEntryRow,
  ReportProjectRef,
  ReportsDataset,
} from '@/features/reports/domain'

/** Kurs uzywany we wszystkich testach — 1 EUR = 4,00 PLN, zeby liczby byly czytelne. */
export const EUR_RATE = 4

export const CLIENT_HOURLY_PLN: ReportClientRef = {
  id: 'client-pln',
  name: 'Acme',
  rate: 100,
  currency: 'PLN',
  work_type: 'hourly',
}

export const CLIENT_HOURLY_EUR: ReportClientRef = {
  id: 'client-eur',
  name: 'Bravo GmbH',
  rate: 50,
  currency: 'EUR',
  work_type: 'hourly',
}

export const CLIENT_PIECEWORK: ReportClientRef = {
  id: 'client-piece',
  name: 'Cargo',
  rate: 12,
  currency: 'PLN',
  work_type: 'piecework',
}

export const CLIENT_NO_RATE: ReportClientRef = {
  id: 'client-free',
  name: 'Pro bono',
  rate: 0,
  currency: 'PLN',
  work_type: 'hourly',
}

export const PROJECT_A: ReportProjectRef = {
  id: 'project-a',
  name: 'Alpha',
  client_id: CLIENT_HOURLY_PLN.id,
  address: 'ul. Słoneczna 10, 80-001 Gdańsk',
}

/** Projekt bez adresu — zestawienie miejsc pracy musi to znosic. */
export const PROJECT_B: ReportProjectRef = {
  id: 'project-b',
  name: 'Beta',
  client_id: CLIENT_HOURLY_EUR.id,
  address: null,
}

export function entry(overrides: Partial<ReportEntryRow> = {}): ReportEntryRow {
  return {
    id: 'entry-1',
    client_id: CLIENT_HOURLY_PLN.id,
    project_id: PROJECT_A.id,
    date: '2026-09-10',
    status: 'worked',
    entry_kind: 'real',
    source: 'manual',
    hours: 8,
    quantity: null,
    quantity_from: null,
    quantity_to: null,
    tags: [],
    billing_rate: 100,
    billing_currency: 'PLN',
    billing_work_type: 'hourly',
    billing_unit: null,
    ...overrides,
  }
}

export function dataset(
  entries: ReportEntryRow[],
  overrides: Partial<ReportsDataset> = {},
): ReportsDataset {
  return {
    window: { start: '2000-01-01', end: '2100-01-01' },
    entries,
    clients: [CLIENT_HOURLY_PLN, CLIENT_HOURLY_EUR, CLIENT_PIECEWORK, CLIENT_NO_RATE],
    projects: [PROJECT_A, PROJECT_B],
    eurRate: EUR_RATE,
    ...overrides,
  }
}

export const ALL_FILTERS = {
  preset: 'custom' as const,
  from: '2026-09-01',
  to: '2026-09-30',
  clientId: 'all',
  projectId: 'all',
  tag: 'all',
  compare: false,
}
