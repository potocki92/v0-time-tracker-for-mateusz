import { describe, expect, it } from 'vitest'
import {
  buildBreakdown,
  buildInsights,
  buildReportModel,
  buildTrend,
  computeDelta,
  bucketKeyOf,
  computeKpis,
  longestStreak,
  resolveBucketUnit,
  axisTickInterval,
} from '@/features/reports/domain'
import type { ReportRecord } from '@/features/reports/domain'
import { ALL_FILTERS, CLIENT_HOURLY_EUR, CLIENT_PIECEWORK, dataset, entry } from './fixtures'

const TODAY = '2026-09-30'

function record(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: 'r1',
    date: '2026-09-10',
    clientId: 'client-pln',
    clientName: 'Acme',
    projectId: 'project-a',
    projectName: 'Alpha',
    projectAddress: null,
    hours: 8,
    quantity: 0,
    workType: 'hourly',
    appliedRateMinor: 10_000,
    appliedCurrency: 'PLN',
    valueMinor: 80_000,
    valueBaseMinor: 80_000,
    billable: true,
    tags: [],
    source: 'manual',
    ...overrides,
  }
}

describe('computeDelta — porownanie z poprzednim okresem', () => {
  it('liczy procent i wartosc bezwzgledna', () => {
    const delta = computeDelta(120, 100)
    expect(delta.absolute).toBe(20)
    expect(delta.ratio).toBeCloseTo(0.2)
    expect(delta.status).toBe('up')
  })

  it('spadek jest ujemny', () => {
    const delta = computeDelta(80, 100)
    expect(delta.ratio).toBeCloseTo(-0.2)
    expect(delta.status).toBe('down')
  })

  it('drobna roznica to brak zmiany, nie 0,2%', () => {
    expect(computeDelta(100.1, 100).status).toBe('flat')
  })

  it('poprzednia wartosc 0 nie daje falszywego 0% ani nieskonczonosci', () => {
    const delta = computeDelta(10, 0)
    expect(delta.ratio).toBeNull()
    expect(delta.status).toBe('new')
  })

  it('0 wobec 0 to brak danych do porownania', () => {
    const delta = computeDelta(0, 0)
    expect(delta.ratio).toBeNull()
    expect(delta.status).toBe('empty')
  })
})

describe('porownanie obejmuje komplet metryk, nie tylko godziny', () => {
  const model = buildReportModel(
    dataset([
      entry({ id: 'now', date: '2026-09-20', hours: 10, billing_rate: 100 }),
      entry({ id: 'before', date: '2026-08-20', hours: 5, billing_rate: 100 }),
    ]),
    { ...ALL_FILTERS, from: '2026-09-01', to: '2026-09-30', compare: true },
    TODAY,
  )

  it('poprzedni okres ma te sama dlugosc', () => {
    expect(model.comparison?.previousRange).toEqual({ start: '2026-08-02', end: '2026-08-31' })
  })

  it('kazda metryka KPI ma swoja zmiane', () => {
    expect(Object.keys(model.comparison!.deltas).sort()).toEqual([
      'activeDays',
      'avgHoursPerActiveDay',
      'billableRatio',
      'effectiveHourlyRate',
      'totalHours',
      'workValue',
    ])
    expect(model.comparison!.deltas.totalHours.ratio).toBeCloseTo(1)
    expect(model.comparison!.deltas.workValue.absolute).toBe(50_000)
  })

  it('bez wlaczonego porownania model nie ma sekcji porownania', () => {
    const plain = buildReportModel(dataset([]), ALL_FILTERS, TODAY)
    expect(plain.comparison).toBeNull()
  })
})

describe('resolveBucketUnit', () => {
  it('krotkie zakresy w dniach', () => {
    expect(resolveBucketUnit(1)).toBe('day')
    expect(resolveBucketUnit(31)).toBe('day')
  })

  it('srednie zakresy w tygodniach', () => {
    expect(resolveBucketUnit(32)).toBe('week')
    expect(resolveBucketUnit(182)).toBe('week')
  })

  it('dlugie zakresy w miesiacach', () => {
    expect(resolveBucketUnit(183)).toBe('month')
    expect(resolveBucketUnit(366)).toBe('month')
  })
})

describe('bucketKeyOf', () => {
  it('dzien to sama data', () => {
    expect(bucketKeyOf('2026-09-10', 'day')).toBe('2026-09-10')
  })

  it('miesiac ucina dzien', () => {
    expect(bucketKeyOf('2026-09-10', 'month')).toBe('2026-09')
  })

  it('tydzien uzywa numeracji ISO', () => {
    expect(bucketKeyOf('2026-09-10', 'week')).toBe('2026-W37')
  })
})

describe('buildTrend', () => {
  it('tworzy kubelek dla KAZDEGO dnia zakresu, takze pustego', () => {
    const trend = buildTrend(
      { start: '2026-09-01', end: '2026-09-05' },
      [record({ date: '2026-09-03', hours: 4, valueBaseMinor: 40_000 })],
      null,
    )
    expect(trend.unit).toBe('day')
    expect(trend.points).toHaveLength(5)
    expect(trend.points.map((point) => point.hours)).toEqual([0, 0, 4, 0, 0])
    expect(trend.points[2].valueBaseMinor).toBe(40_000)
  })

  it('grupuje po miesiacach dla dlugiego zakresu', () => {
    const trend = buildTrend(
      { start: '2026-01-01', end: '2026-12-31' },
      [
        record({ date: '2026-01-15', hours: 3 }),
        record({ id: 'r2', date: '2026-01-20', hours: 2 }),
        record({ id: 'r3', date: '2026-07-01', hours: 7 }),
      ],
      null,
    )
    expect(trend.unit).toBe('month')
    expect(trend.points).toHaveLength(12)
    expect(trend.points[0]).toMatchObject({ key: '2026-01', hours: 5 })
    expect(trend.points[6]).toMatchObject({ key: '2026-07', hours: 7 })
  })

  it('bez porownania nie zwraca serii poprzedniej', () => {
    const trend = buildTrend({ start: '2026-09-01', end: '2026-09-02' }, [], null)
    expect(trend.points.every((point) => point.previousHours === null)).toBe(true)
  })

  it('z porownaniem dokleja rownolegly kubelek poprzedniego okresu', () => {
    const trend = buildTrend(
      { start: '2026-09-03', end: '2026-09-04' },
      [record({ date: '2026-09-03', hours: 8 })],
      {
        range: { start: '2026-09-01', end: '2026-09-02' },
        records: [record({ id: 'p', date: '2026-09-01', hours: 6 })],
      },
    )
    expect(trend.points[0].previousHours).toBe(6)
    expect(trend.points[1].previousHours).toBe(0)
  })
})

describe('axisTickInterval', () => {
  it('pokazuje wszystkie etykiety, gdy sie miesza', () => {
    expect(axisTickInterval(8, 12)).toBe(0)
  })

  it('przerzedza etykiety przy dlugiej osi', () => {
    expect(axisTickInterval(60, 12)).toBe(4)
  })
})

describe('buildBreakdown', () => {
  const records = [
    record({ id: 'a', hours: 6, valueBaseMinor: 60_000, tags: ['dev', 'ops'] }),
    record({
      id: 'b',
      clientId: 'client-eur',
      clientName: 'Bravo GmbH',
      projectId: null,
      projectName: null,
      hours: 2,
      valueBaseMinor: 40_000,
      tags: [],
    }),
  ]

  it('sumuje godziny i wartosc na klienta i liczy udzialy', () => {
    const items = buildBreakdown(records, 'client')
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ label: 'Acme', hours: 6, entryCount: 1 })
    expect(items[0].share).toBeCloseTo(0.75)
    expect(items[1].share).toBeCloseTo(0.25)
  })

  it('udzialy sumuja sie do 100% dla klientow i projektow', () => {
    const total = buildBreakdown(records, 'client').reduce((sum, item) => sum + item.share, 0)
    expect(total).toBeCloseTo(1)
  })

  it('pozycja bez przypisania ma pusta etykiete — podstawia ja UI', () => {
    const items = buildBreakdown(records, 'project')
    expect(items.map((item) => item.label)).toEqual(['Alpha', null])
  })

  it('wpis z kilkoma tagami wchodzi do kazdego z nich', () => {
    const items = buildBreakdown(records, 'tag')
    expect(items.map((item) => item.key).sort()).toEqual(['', 'dev', 'ops'])
    expect(items.find((item) => item.key === 'dev')!.hours).toBe(6)
    expect(items.find((item) => item.key === 'ops')!.hours).toBe(6)
  })

  it('liczy stawke efektywna pozycji', () => {
    const items = buildBreakdown(records, 'client')
    expect(items[0].effectiveHourlyRateMinor).toBe(10_000)
  })

  it('pozycja bez godzin nie ma stawki efektywnej', () => {
    const items = buildBreakdown([record({ hours: 0, valueBaseMinor: 5_000 })], 'client')
    expect(items[0].effectiveHourlyRateMinor).toBeNull()
  })

  it('pusty zbior daje pusta liste, a nie dzielenie przez zero', () => {
    expect(buildBreakdown([], 'client')).toEqual([])
  })
})

describe('longestStreak', () => {
  it('liczy kolejne dni kalendarzowe', () => {
    expect(longestStreak(['2026-09-01', '2026-09-02', '2026-09-03'])).toBe(3)
  })

  it('przerwa zaczyna nowa serie', () => {
    expect(longestStreak(['2026-09-01', '2026-09-02', '2026-09-05', '2026-09-06'])).toBe(2)
  })

  it('ignoruje duplikaty i kolejnosc', () => {
    expect(longestStreak(['2026-09-02', '2026-09-01', '2026-09-02'])).toBe(2)
  })

  it('seria przechodzi przez granice miesiaca', () => {
    expect(longestStreak(['2026-08-31', '2026-09-01'])).toBe(2)
  })

  it('pusty zbior to zero', () => {
    expect(longestStreak([])).toBe(0)
  })
})

describe('buildInsights', () => {
  const range = { start: '2026-09-07', end: '2026-09-13' } // pn–nd

  it('liczy rozklad dni tygodnia i wskazuje najbardziej pracowity', () => {
    const insights = buildInsights(
      [
        record({ date: '2026-09-07', hours: 3 }),
        record({ id: 'b', date: '2026-09-09', hours: 9 }),
      ],
      range,
    )

    expect(insights.weekdayLoad).toHaveLength(7)
    expect(insights.weekdayLoad[0]).toMatchObject({ weekday: 0, hours: 3, activeDays: 1 })
    expect(insights.busiestWeekday).toBe(2)
    expect(insights.weekdayLoad.every((slot) => slot.occurrences === 1)).toBe(true)
  })

  it('wskazuje najdluzszy dzien i liczy dni bez pracy', () => {
    const insights = buildInsights(
      [
        record({ date: '2026-09-07', hours: 3 }),
        record({ id: 'b', date: '2026-09-09', hours: 9 }),
      ],
      range,
    )
    expect(insights.longestDay).toEqual({ date: '2026-09-09', hours: 9 })
    expect(insights.daysWithoutWork).toBe(5)
    expect(insights.spanDays).toBe(7)
  })

  it('pusty okres nie ma najbardziej pracowitego dnia', () => {
    const insights = buildInsights([], range)
    expect(insights.busiestWeekday).toBeNull()
    expect(insights.longestDay).toBeNull()
    expect(insights.daysWithoutWork).toBe(7)
  })
})

describe('computeKpis dla zbioru mieszanego', () => {
  it('sumuje godziny i wartosc niezaleznie od rodzaju rozliczenia', () => {
    const kpis = computeKpis([
      record({ hours: 8, valueBaseMinor: 80_000 }),
      record({ id: 'p', date: '2026-09-11', hours: 0, workType: 'piecework', quantity: 10, valueBaseMinor: 12_000 }),
    ])
    expect(kpis.totalHours).toBe(8)
    expect(kpis.workValueMinor).toBe(92_000)
    expect(kpis.activeDays).toBe(2)
  })
})

describe('model — heatmapa', () => {
  it('krotki zakres nie dostaje heatmapy', () => {
    const model = buildReportModel(
      dataset([entry({ date: '2026-09-10', hours: 8 })]),
      { ...ALL_FILTERS, from: '2026-09-01', to: '2026-09-30' },
      TODAY,
    )
    expect(model.heatmap).toBeNull()
  })

  it('dluzszy zakres dostaje po jednej komorce na dzien', () => {
    const model = buildReportModel(
      dataset([
        entry({ date: '2026-08-10', hours: 8 }),
        entry({ id: 'e2', date: '2026-09-10', hours: 4 }),
      ]),
      { ...ALL_FILTERS, from: '2026-07-01', to: '2026-09-30' },
      TODAY,
    )
    expect(model.heatmap).toHaveLength(92)
    expect(model.heatmap!.find((day) => day.date === '2026-08-10')!.level).toBe(4)
    expect(model.heatmap!.find((day) => day.date === '2026-09-10')!.level).toBe(2)
    expect(model.heatmap!.find((day) => day.date === '2026-07-01')!.level).toBe(0)
  })
})

describe('model — wartosc pracy w walucie raportu', () => {
  it('miesza PLN i EUR do jednej sumy po kursie konta', () => {
    const model = buildReportModel(
      dataset([
        entry({ id: 'pln', hours: 1, billing_rate: 100, billing_currency: 'PLN' }),
        entry({
          id: 'eur',
          date: '2026-09-11',
          client_id: CLIENT_HOURLY_EUR.id,
          project_id: null,
          hours: 1,
          billing_rate: 50,
          billing_currency: 'EUR',
        }),
        entry({
          id: 'piece',
          date: '2026-09-12',
          client_id: CLIENT_PIECEWORK.id,
          project_id: null,
          hours: 0,
          quantity: 10,
          billing_rate: 12,
          billing_work_type: 'piecework',
        }),
      ]),
      ALL_FILTERS,
      TODAY,
    )

    expect(model.kpis.workValueMinor).toBe(10_000 + 5_000 * 4 + 12_000)
    expect(model.currency).toBe('PLN')
  })
})
