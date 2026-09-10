import { describe, expect, it } from 'vitest'
import { buildReportModel, projectAfterClientChange, projectsForClient } from '@/features/reports/domain'
import { buildReportCsv, buildReportJson, exportFileName } from '@/features/reports/domain/export'
import {
  ALL_FILTERS,
  CLIENT_HOURLY_EUR,
  PROJECT_A,
  PROJECT_B,
  dataset,
  entry,
} from './fixtures'

const TODAY = '2026-09-30'

const LABELS = {
  date: 'Data',
  client: 'Klient',
  project: 'Projekt',
  workType: 'Rozliczenie',
  hours: 'Godziny',
  quantity: 'Ilosc',
  rate: 'Stawka',
  currency: 'Waluta',
  value: 'Wartosc',
  valueBase: 'Wartosc',
  billable: 'Billable',
  tags: 'Tagi',
  source: 'Zrodlo',
}

const BOOLEANS = { yes: 'tak', no: 'nie' }

const model = buildReportModel(
  dataset([
    entry({ id: 'a', hours: 8, billing_rate: 100, tags: ['dev', 'ops'] }),
    entry({
      id: 'b',
      date: '2026-09-11',
      client_id: CLIENT_HOURLY_EUR.id,
      project_id: PROJECT_B.id,
      hours: 2,
      billing_rate: 50,
      billing_currency: 'EUR',
      source: 'automation',
    }),
  ]),
  ALL_FILTERS,
  TODAY,
)

describe('CSV', () => {
  const csv = buildReportCsv(model, LABELS, BOOLEANS)
  const lines = csv.split('\n')

  it('zaczyna sie od BOM, zeby Excel nie zjadl polskich znakow', () => {
    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('niesie kolumny finansowe, nie tylko godziny', () => {
    expect(lines[0]).toContain('Stawka')
    expect(lines[0]).toContain('Waluta')
    expect(lines[0]).toContain('Wartosc (PLN)')
    expect(lines[0]).toContain('Billable')
  })

  it('ma jeden wiersz na wpis raportu', () => {
    expect(lines).toHaveLength(3)
  })

  it('zapisuje stawke i wartosc w jednostkach glownych', () => {
    expect(lines[1]).toContain(',100,PLN,800,800,')
  })

  it('waluta wpisu i waluta raportu sa osobnymi kolumnami', () => {
    expect(lines[2]).toContain(',50,EUR,100,400,')
  })

  it('tagi ida w jednej komorce rozdzielone pionowa kreska', () => {
    expect(lines[1]).toContain('dev|ops')
  })

  it('escapuje przecinki w nazwach', () => {
    const withComma = buildReportCsv(
      buildReportModel(
        dataset([entry({ id: 'x' })], {
          clients: [{ id: 'client-pln', name: 'Acme, Inc.', rate: 100, currency: 'PLN', work_type: 'hourly' }],
        }),
        ALL_FILTERS,
        TODAY,
      ),
      LABELS,
      BOOLEANS,
    )
    expect(withComma).toContain('"Acme, Inc."')
  })
})

describe('JSON', () => {
  const payload = JSON.parse(buildReportJson(model, '2026-09-30T10:00:00.000Z'))

  it('niesie zakres, walute i kurs', () => {
    expect(payload.range).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(payload.currency).toBe('PLN')
    expect(payload.eurRate).toBe(4)
  })

  it('niesie policzone KPI, a nie surowe wiersze bazy', () => {
    expect(payload.kpis.totalHours).toBe(10)
    expect(payload.kpis.workValue).toBe(1200)
    expect(payload.kpis.activeDays).toBe(2)
  })

  it('niesie breakdowny', () => {
    expect(payload.breakdowns.client).toHaveLength(2)
    expect(payload.breakdowns.tag.map((item: { key: string }) => item.key).sort()).toEqual([
      '',
      'dev',
      'ops',
    ])
  })

  it('niesie wpisy z zastosowana stawka i zrodlem', () => {
    expect(payload.entries[1]).toMatchObject({
      currency: 'EUR',
      rate: 50,
      value: 100,
      valueBase: 400,
      source: 'automation',
    })
  })
})

describe('nazwa pliku', () => {
  it('zawiera zakres raportu', () => {
    expect(exportFileName('raport', model, 'csv')).toBe('raport_2026-09-01_2026-09-30.csv')
  })
})

describe('kaskada klient → projekt', () => {
  const projects = [PROJECT_A, PROJECT_B]

  it('projekt innego klienta zostaje wyczyszczony', () => {
    expect(projectAfterClientChange(projects, CLIENT_HOURLY_EUR.id, PROJECT_A.id)).toBe('all')
  })

  it('projekt tego samego klienta zostaje', () => {
    expect(projectAfterClientChange(projects, PROJECT_A.client_id, PROJECT_A.id)).toBe(PROJECT_A.id)
  })

  it('powrot do „wszyscy klienci" nie czysci projektu', () => {
    expect(projectAfterClientChange(projects, 'all', PROJECT_A.id)).toBe(PROJECT_A.id)
  })

  it('lista projektow zaweza sie do klienta', () => {
    expect(projectsForClient(projects, CLIENT_HOURLY_EUR.id)).toEqual([PROJECT_B])
    expect(projectsForClient(projects, 'all')).toHaveLength(2)
  })
})
