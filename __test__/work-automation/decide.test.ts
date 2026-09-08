import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WEEK_SCHEDULE,
  decideDay,
  hasWorkingDay,
  isDue,
  nextRunInstant,
  planDays,
  weekdayKeyOf,
  type DayDecisionInput,
  type ExistingEntry,
  type WeekSchedule,
} from '@/features/work-automation/domain'

const ACTIVATION = '2026-09-01'

/** Wrzesien 2026: 1. to wtorek, 5. sobota, 6. niedziela. */
const decide = (overrides: Partial<DayDecisionInput> = {}) =>
  decideDay({
    date: '2026-09-08',
    weekSchedule: DEFAULT_WEEK_SCHEDULE,
    activationDate: ACTIVATION,
    trips: [],
    resumptions: [],
    existingEntries: [],
    ...overrides,
  })

const allDaysOn: WeekSchedule = {
  ...DEFAULT_WEEK_SCHEDULE,
  sun: { enabled: true, hours: 8 },
}

describe('weekdayKeyOf', () => {
  it('mapuje date na dzien tygodnia', () => {
    expect(weekdayKeyOf('2026-09-01')).toBe('tue')
    expect(weekdayKeyOf('2026-09-05')).toBe('sat')
    expect(weekdayKeyOf('2026-09-06')).toBe('sun')
  })
})

describe('decideDay — grafik tygodnia', () => {
  it('brak zjazdow i wszystkie dni wlaczone: zapis kazdego dnia', () => {
    const dates = ['2026-09-07', '2026-09-08', '2026-09-12', '2026-09-13']
    for (const date of dates) {
      expect(decide({ date, weekSchedule: allDaysOn })).toMatchObject({ action: 'create' })
    }
  })

  it('brak zjazdow i wylaczona niedziela: brak wpisu w niedziele', () => {
    expect(decide({ date: '2026-09-06' })).toEqual({
      action: 'skip',
      date: '2026-09-06',
      reason: 'weekday_off',
    })
  })

  it('bierze liczbe godzin z grafiku danego dnia', () => {
    expect(decide({ date: '2026-09-08' })).toEqual({
      action: 'create',
      date: '2026-09-08',
      hours: 10,
    })
    expect(decide({ date: '2026-09-05' })).toEqual({
      action: 'create',
      date: '2026-09-05',
      hours: 8,
    })
  })

  it('dzien wlaczony z zerem godzin traktuje jak wylaczony', () => {
    const schedule: WeekSchedule = { ...allDaysOn, tue: { enabled: true, hours: 0 } }
    expect(decide({ date: '2026-09-08', weekSchedule: schedule })).toMatchObject({
      reason: 'weekday_off',
    })
  })
})

describe('decideDay — granice okresu', () => {
  it('nie zapisuje dni sprzed uruchomienia automatu', () => {
    expect(decide({ date: '2026-08-31' })).toMatchObject({ reason: 'before_start' })
  })

  it('dzien rozpoczecia i dzien powrotu moga byc zapisane, jesli grafik pozwala', () => {
    const trips = [{ startDate: '2026-09-07', endDate: '2026-09-11' }]
    expect(decide({ date: '2026-09-07', trips })).toMatchObject({ action: 'create' })
    expect(decide({ date: '2026-09-11', trips })).toMatchObject({ action: 'create' })
  })

  it('data wewnatrz pobytu w domu nie dostaje godzin', () => {
    const trips = [
      { startDate: '2026-09-01', endDate: '2026-09-12' },
      { startDate: '2026-09-21', endDate: '2026-09-30' },
    ]
    expect(decide({ date: '2026-09-15', trips })).toMatchObject({ reason: 'home_stay' })
  })

  it('dzien wyjazdu nadal podlega ustawieniu dnia tygodnia', () => {
    const trips = [{ startDate: '2026-09-01', endDate: '2026-09-12' }]
    expect(decide({ date: '2026-09-06', trips })).toMatchObject({ reason: 'weekday_off' })
  })
})

describe('decideDay — pierwszenstwo danych uzytkownika', () => {
  const cases: Array<[string, ExistingEntry[]]> = [
    ['reczna praca', [{ entryKind: 'real' }]],
    ['urlop, choroba albo dzien wolny', [{ entryKind: 'real' }]],
  ]

  it.each(cases)('istniejacy wpis rzeczywisty (%s) blokuje zapis', (_label, existingEntries) => {
    expect(decide({ existingEntries })).toMatchObject({ reason: 'entry_exists' })
  })

  it('sam plan `predicted` nie blokuje utworzenia wpisu rzeczywistego', () => {
    expect(decide({ existingEntries: [{ entryKind: 'predicted' }] })).toMatchObject({
      action: 'create',
      hours: 10,
    })
  })

  it('plan obok wpisu rzeczywistego nadal oznacza pominiecie', () => {
    expect(
      decide({ existingEntries: [{ entryKind: 'predicted' }, { entryKind: 'real' }] }),
    ).toMatchObject({ reason: 'entry_exists' })
  })
})

describe('planDays', () => {
  it('liczy podglad ta sama logika, co decyzja pojedynczego dnia', () => {
    const decisions = planDays({
      config: { startDate: ACTIVATION, weekSchedule: DEFAULT_WEEK_SCHEDULE },
      trips: [],
      resumptions: [],
      entriesByDate: new Map([['2026-09-08', [{ entryKind: 'real' as const }]]]),
      fromDate: '2026-09-07',
      days: 7,
    })

    expect(decisions.map((decision) => decision.date)).toEqual([
      '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10',
      '2026-09-11', '2026-09-12', '2026-09-13',
    ])
    expect(decisions[1]).toMatchObject({ reason: 'entry_exists' })
    // 13.09 to niedziela — domyslnie wylaczona.
    expect(decisions[6]).toMatchObject({ reason: 'weekday_off' })
  })
})

describe('isDue', () => {
  it('nie zapisuje dni przyszlych', () => {
    expect(isDue('2026-09-09', '2026-09-08', 1439, 19 * 60)).toBe(false)
  })

  it('dzisiaj dopiero po ustawionej godzinie', () => {
    expect(isDue('2026-09-08', '2026-09-08', 18 * 60 + 59, 19 * 60)).toBe(false)
    expect(isDue('2026-09-08', '2026-09-08', 19 * 60, 19 * 60)).toBe(true)
  })

  it('zaleglosci sa wymagalne niezaleznie od godziny', () => {
    expect(isDue('2026-09-07', '2026-09-08', 0, 19 * 60)).toBe(true)
  })
})

describe('nextRunInstant', () => {
  const config = { runTime: '19:00', timeZone: 'Europe/Warsaw' }

  it('przed godzina zapisu wskazuje dzisiejszy termin', () => {
    // 2026-09-08 12:00 UTC = 14:00 w Warszawie.
    const next = nextRunInstant(config, new Date('2026-09-08T12:00:00Z'))
    expect(next?.toISOString()).toBe('2026-09-08T17:00:00.000Z')
  })

  it('po godzinie zapisu przechodzi na jutro', () => {
    const next = nextRunInstant(config, new Date('2026-09-08T18:00:00Z'))
    expect(next?.toISOString()).toBe('2026-09-09T17:00:00.000Z')
  })

  it('zima ta sama godzina scienna wypada godzine pozniej w UTC', () => {
    const next = nextRunInstant(config, new Date('2026-12-01T10:00:00Z'))
    expect(next?.toISOString()).toBe('2026-12-01T18:00:00.000Z')
  })
})

describe('hasWorkingDay', () => {
  it('wymaga przynajmniej jednego dnia z dodatnia liczba godzin', () => {
    expect(hasWorkingDay(DEFAULT_WEEK_SCHEDULE)).toBe(true)
    const nothing = Object.fromEntries(
      Object.keys(DEFAULT_WEEK_SCHEDULE).map((key) => [key, { enabled: false, hours: 8 }]),
    ) as WeekSchedule
    expect(hasWorkingDay(nothing)).toBe(false)
  })
})
