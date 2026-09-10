import { describe, expect, it } from 'vitest'
import { buildReportModel, isBillable, isPerformedWork } from '@/features/reports/domain'
import {
  ALL_FILTERS,
  CLIENT_HOURLY_EUR,
  CLIENT_HOURLY_PLN,
  CLIENT_NO_RATE,
  CLIENT_PIECEWORK,
  EUR_RATE,
  PROJECT_A,
  dataset,
  entry,
} from './fixtures'

const TODAY = '2026-09-30'
const model = (entries: Parameters<typeof dataset>[0], filters = ALL_FILTERS) =>
  buildReportModel(dataset(entries), filters, TODAY)

describe('isPerformedWork — jedyna definicja wykonanej pracy', () => {
  it('przepuszcza wpis `real` ze statusem `worked`', () => {
    expect(isPerformedWork({ status: 'worked', entry_kind: 'real' })).toBe(true)
  })

  it('brak `entry_kind` znaczy `real`', () => {
    expect(isPerformedWork({ status: 'worked', entry_kind: undefined })).toBe(true)
  })

  it('odrzuca plan i nieobecnosci', () => {
    expect(isPerformedWork({ status: 'worked', entry_kind: 'predicted' })).toBe(false)
    expect(isPerformedWork({ status: 'vacation', entry_kind: 'real' })).toBe(false)
    expect(isPerformedWork({ status: 'not_worked', entry_kind: 'real' })).toBe(false)
  })
})

describe('real vs predicted', () => {
  it('plan nie wchodzi do zadnej liczby raportu', () => {
    const result = model([
      entry({ id: 'real', hours: 8 }),
      entry({ id: 'plan', entry_kind: 'predicted', hours: 12 }),
    ])

    expect(result.kpis.totalHours).toBe(8)
    expect(result.kpis.entryCount).toBe(1)
    expect(result.records.map((record) => record.id)).toEqual(['real'])
    expect(result.breakdowns.client[0].hours).toBe(8)
  })

  it('wpis bez `entry_kind` jest traktowany jak `real` — dane sprzed migracji zostaja', () => {
    const result = model([entry({ entry_kind: undefined, hours: 5 })])
    expect(result.kpis.totalHours).toBe(5)
  })

  it('nieobecnosci nie sa wykonana praca', () => {
    const result = model([
      entry({ id: 'worked', hours: 8 }),
      entry({ id: 'vacation', status: 'vacation', hours: 8 }),
      entry({ id: 'sick', status: 'sick_leave', hours: 8 }),
    ])
    expect(result.kpis.totalHours).toBe(8)
  })
})

describe('pieniadze — stawka wpisu vs fallback do klienta', () => {
  it('uzywa stawki zapisanej we wpisie', () => {
    const result = model([entry({ hours: 8, billing_rate: 150 })])
    expect(result.kpis.workValueMinor).toBe(120_000)
  })

  it('bez stawki we wpisie cofa sie do stawki klienta', () => {
    const result = model([
      entry({
        hours: 8,
        billing_rate: null,
        billing_currency: null,
        billing_work_type: null,
      }),
    ])
    expect(result.kpis.workValueMinor).toBe(8 * 100 * 100)
  })

  it('przelicza EUR na walute raportu po kursie konta', () => {
    const result = model([
      entry({
        client_id: CLIENT_HOURLY_EUR.id,
        project_id: null,
        hours: 10,
        billing_rate: 50,
        billing_currency: 'EUR',
      }),
    ])
    expect(result.records[0].valueMinor).toBe(50_000)
    expect(result.records[0].appliedCurrency).toBe('EUR')
    expect(result.kpis.workValueMinor).toBe(50_000 * EUR_RATE)
  })

  it('akord liczy ilosc razy stawka, nie godziny', () => {
    const result = model([
      entry({
        client_id: CLIENT_PIECEWORK.id,
        project_id: null,
        hours: 0,
        quantity: 25,
        billing_rate: 12,
        billing_work_type: 'piecework',
      }),
    ])
    expect(result.kpis.workValueMinor).toBe(25 * 12 * 100)
    expect(result.records[0].quantity).toBe(25)
  })

  it('akord z zakresu licznikow liczy roznice', () => {
    const result = model([
      entry({
        client_id: CLIENT_PIECEWORK.id,
        project_id: null,
        hours: 0,
        quantity: null,
        quantity_from: 100,
        quantity_to: 130,
        billing_rate: 12,
        billing_work_type: 'piecework',
      }),
    ])
    expect(result.kpis.workValueMinor).toBe(30 * 12 * 100)
  })

  it('brak stawki i brak stawki klienta to zero, nie NaN', () => {
    const result = model([
      entry({
        client_id: CLIENT_NO_RATE.id,
        project_id: null,
        hours: 6,
        billing_rate: null,
        billing_currency: null,
        billing_work_type: null,
      }),
    ])
    expect(result.kpis.workValueMinor).toBe(0)
    expect(result.kpis.totalHours).toBe(6)
  })

  it('brak godzin przy rozliczeniu godzinowym to zero wartosci', () => {
    const result = model([entry({ hours: null })])
    expect(result.kpis.workValueMinor).toBe(0)
    expect(result.kpis.totalHours).toBe(0)
  })
})

describe('billable — regresja fallbacku do stawki klienta', () => {
  it('wpis bez `billing_rate` u klienta z poprawna stawka JEST rozliczany', () => {
    const row = entry({ billing_rate: null, billing_currency: null, billing_work_type: null })
    expect(isBillable(row, CLIENT_HOURLY_PLN)).toBe(true)

    const result = model([row])
    expect(result.kpis.billableRatio).toBe(1)
  })

  it('wpis bez stawki u klienta bez stawki NIE jest rozliczany', () => {
    const row = entry({
      client_id: CLIENT_NO_RATE.id,
      project_id: null,
      billing_rate: null,
      billing_currency: null,
      billing_work_type: null,
    })
    expect(isBillable(row, CLIENT_NO_RATE)).toBe(false)
  })

  it('udzial billable liczy sie po godzinach', () => {
    const result = model([
      entry({ id: 'paid', hours: 6, billing_rate: 100 }),
      entry({
        id: 'free',
        date: '2026-09-11',
        client_id: CLIENT_NO_RATE.id,
        project_id: null,
        hours: 2,
        billing_rate: null,
        billing_currency: null,
        billing_work_type: null,
      }),
    ])
    expect(result.kpis.billableRatio).toBeCloseTo(0.75)
  })

  it('bez godzin udzial billable jest nieokreslony, a nie zerowy', () => {
    const result = model([])
    expect(result.kpis.billableRatio).toBeNull()
  })
})

describe('KPI', () => {
  it('liczy dni z praca, srednia dzienna i stawke efektywna', () => {
    const result = model([
      entry({ id: 'a', date: '2026-09-10', hours: 8, billing_rate: 100 }),
      entry({ id: 'b', date: '2026-09-10', hours: 2, billing_rate: 100 }),
      entry({ id: 'c', date: '2026-09-11', hours: 5, billing_rate: 100 }),
    ])

    expect(result.kpis.totalHours).toBe(15)
    expect(result.kpis.activeDays).toBe(2)
    expect(result.kpis.avgHoursPerActiveDay).toBe(7.5)
    expect(result.kpis.effectiveHourlyRateMinor).toBe(10_000)
  })

  it('stawka efektywna jest nieokreslona, gdy praca nie ma godzin', () => {
    const result = model([
      entry({
        client_id: CLIENT_PIECEWORK.id,
        project_id: null,
        hours: 0,
        quantity: 10,
        billing_rate: 12,
        billing_work_type: 'piecework',
      }),
    ])
    expect(result.kpis.effectiveHourlyRateMinor).toBeNull()
  })
})

describe('filtry przekrojowe', () => {
  const entries = [
    entry({ id: 'a', client_id: CLIENT_HOURLY_PLN.id, project_id: PROJECT_A.id, hours: 4, tags: ['dev'] }),
    entry({
      id: 'b',
      date: '2026-09-11',
      client_id: CLIENT_HOURLY_EUR.id,
      project_id: null,
      hours: 6,
      tags: ['ops'],
      billing_currency: 'EUR',
      billing_rate: 50,
    }),
  ]

  it('filtr klienta zaweza zbior', () => {
    const result = model(entries, { ...ALL_FILTERS, clientId: CLIENT_HOURLY_PLN.id })
    expect(result.records.map((record) => record.id)).toEqual(['a'])
  })

  it('filtr projektu zaweza zbior', () => {
    const result = model(entries, { ...ALL_FILTERS, projectId: PROJECT_A.id })
    expect(result.records.map((record) => record.id)).toEqual(['a'])
  })

  it('filtr tagu zaweza zbior, ale lista tagow zostaje pelna', () => {
    const result = model(entries, { ...ALL_FILTERS, tag: 'ops' })
    expect(result.records.map((record) => record.id)).toEqual(['b'])
    expect(result.availableTags).toEqual(['dev', 'ops'])
  })

  it('zakres dat jest domkniety obustronnie', () => {
    const result = model(
      [
        entry({ id: 'before', date: '2026-08-31' }),
        entry({ id: 'first', date: '2026-09-01' }),
        entry({ id: 'last', date: '2026-09-30' }),
        entry({ id: 'after', date: '2026-10-01' }),
      ],
      { ...ALL_FILTERS, from: '2026-09-01', to: '2026-09-30' },
    )
    expect(result.records.map((record) => record.id)).toEqual(['first', 'last'])
  })
})
