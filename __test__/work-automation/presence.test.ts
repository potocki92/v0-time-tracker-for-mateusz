import { describe, expect, it } from 'vitest'

import { mergeTripRanges, resolvePresence } from '@/features/work-automation/domain'

/**
 * Reguly zjazdow i powrotow. Kazdy scenariusz odpowiada wierszowi tabeli
 * akceptacyjnej w docs/work-automation.md.
 */

const ACTIVATION = '2026-09-01'

const trip = (startDate: string, endDate: string) => ({ startDate, endDate })

const presence = (date: string, trips = [] as ReturnType<typeof trip>[], resumptions: string[] = []) =>
  resolvePresence({ date, trips, resumptions, activationDate: ACTIVATION })

describe('mergeTripRanges', () => {
  it('scala zakresy nakladajace sie na siebie', () => {
    expect(mergeTripRanges([trip('2026-09-01', '2026-09-12'), trip('2026-09-05', '2026-09-20')])).toEqual([
      trip('2026-09-01', '2026-09-20'),
    ])
  })

  it('scala zakresy przylegajace — miedzy nimi nie ma dnia w domu', () => {
    expect(mergeTripRanges([trip('2026-09-01', '2026-09-12'), trip('2026-09-13', '2026-09-20')])).toEqual([
      trip('2026-09-01', '2026-09-20'),
    ])
  })

  it('zostawia rozlaczne zakresy osobno', () => {
    const ranges = [trip('2026-09-01', '2026-09-12'), trip('2026-09-21', '2026-09-30')]
    expect(mergeTripRanges(ranges)).toEqual(ranges)
  })

  it('pomija zakresy o odwroconych granicach', () => {
    expect(mergeTripRanges([trip('2026-09-20', '2026-09-10')])).toEqual([])
  })
})

describe('resolvePresence — brak zjazdow', () => {
  it('bez zjazdow uznaje kazdy dzien za dzien pracy', () => {
    expect(presence('2026-09-15')).toEqual({ at: 'work', because: 'no_trips' })
  })
})

describe('resolvePresence — wyjazd', () => {
  const trips = [trip('2026-09-01', '2026-09-12'), trip('2026-09-21', '2026-09-30')]

  it('dzien rozpoczecia jest dniem pracy', () => {
    expect(presence('2026-09-01', trips)).toEqual({ at: 'work', because: 'trip' })
  })

  it('dzien powrotu jest jeszcze dniem pracy', () => {
    expect(presence('2026-09-12', trips)).toEqual({ at: 'work', because: 'trip' })
  })

  it('dzien po powrocie to juz pobyt w domu', () => {
    expect(presence('2026-09-13', trips)).toEqual({ at: 'home', because: 'between_trips' })
  })

  it('caly okres miedzy wyjazdami to pobyt w domu', () => {
    expect(presence('2026-09-20', trips)).toEqual({ at: 'home', because: 'between_trips' })
  })

  it('kolejny wyjazd wraca do pracy', () => {
    expect(presence('2026-09-21', trips)).toEqual({ at: 'work', because: 'trip' })
  })

  it('nakladajace sie wyjazdy nie tworza przerwy w srodku', () => {
    const overlapping = [trip('2026-09-01', '2026-09-12'), trip('2026-09-05', '2026-09-20')]
    expect(presence('2026-09-15', overlapping)).toEqual({ at: 'work', because: 'trip' })
  })
})

describe('resolvePresence — powrot bez kolejnego wyjazdu', () => {
  it('wstrzymuje prace od nastepnego dnia po powrocie', () => {
    expect(presence('2026-09-13', [trip('2026-09-01', '2026-09-12')])).toEqual({
      at: 'home',
      because: 'after_return',
    })
  })

  it('jawne wznowienie otwiera nowy okres pracy', () => {
    expect(presence('2026-09-20', [trip('2026-09-01', '2026-09-12')], ['2026-09-15'])).toEqual({
      at: 'work',
      because: 'resumption',
    })
  })

  it('wznowienie sprzed powrotu nie wskrzesza pracy', () => {
    expect(presence('2026-09-20', [trip('2026-09-01', '2026-09-18')], ['2026-09-05'])).toEqual({
      at: 'home',
      because: 'after_return',
    })
  })

  it('pozniejszy powrot konczy okres otwarty wznowieniem', () => {
    const trips = [trip('2026-09-01', '2026-09-12'), trip('2026-09-20', '2026-09-25')]
    expect(presence('2026-09-27', trips, ['2026-09-15'])).toEqual({
      at: 'home',
      because: 'after_return',
    })
  })
})

describe('resolvePresence — archiwalne zjazdy', () => {
  const archived = [trip('2025-05-01', '2025-05-30')]

  it('wyjazd zakonczony przed uruchomieniem nie blokuje automatu na zawsze', () => {
    expect(presence('2026-09-05', archived)).toEqual({ at: 'work', because: 'archived_trips_only' })
  })

  it('ale przed pierwszym zaplanowanym przyszlym wyjazdem czekamy w domu', () => {
    expect(presence('2026-09-05', [...archived, trip('2026-09-21', '2026-09-30')])).toEqual({
      at: 'home',
      because: 'awaiting_first_trip',
    })
  })

  it('sam przyszly wyjazd, bez historii, tez oznacza pobyt w domu', () => {
    expect(presence('2026-09-05', [trip('2026-09-21', '2026-09-30')])).toEqual({
      at: 'home',
      because: 'awaiting_first_trip',
    })
  })
})
