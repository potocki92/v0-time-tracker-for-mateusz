import { describe, expect, it, vi } from 'vitest'
import {
  formatDate,
  formatDateRange,
  formatDayBadge,
  formatIsoWeek,
  formatIsoWeekShort,
  formatMonthTitle,
  formatRelativeDay,
  formatWeekday,
  NO_DATA,
  parseIsoDate,
} from '@/lib/format'

/**
 * Regresja "GRU · SO 12": karta "Ostatnie wpisy" pokazywała grudniowe etykiety
 * przy sierpniowych wpisach. Te testy pilnują, że warstwa formatowania nigdy
 * nie przesunie miesiąca ani dnia — niezależnie od strefy czasowej procesu.
 */

const MONTH_SHORT = [
  'STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE',
  'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU',
]

describe('formatDayBadge', () => {
  it('zwraca właściwy skrót miesiąca dla wszystkich 12 miesięcy 2026', () => {
    for (let month = 1; month <= 12; month += 1) {
      const iso = `2026-${String(month).padStart(2, '0')}-12`
      expect(formatDayBadge(iso).month).toBe(MONTH_SHORT[month - 1])
    }
  })

  it('12.08.2026 to środa w sierpniu, nie sobota w grudniu', () => {
    expect(formatDayBadge('2026-08-12')).toEqual({
      month: 'SIE',
      weekday: 'ŚR',
      day: '12',
    })
  })

  it('granice miesiąca nie przeskakują na sąsiedni miesiąc ani rok', () => {
    expect(formatDayBadge('2026-08-01').month).toBe('SIE')
    expect(formatDayBadge('2026-08-31').month).toBe('SIE')
    expect(formatDayBadge('2026-01-01')).toEqual({
      month: 'STY',
      weekday: 'CZ',
      day: '01',
    })
    expect(formatDayBadge('2026-12-31').month).toBe('GRU')
  })

  it('zmiana czasu nie gubi dnia', () => {
    expect(formatDayBadge('2026-03-29')).toEqual({
      month: 'MAR',
      weekday: 'ND',
      day: '29',
    })
    expect(formatDayBadge('2026-10-25')).toEqual({
      month: 'PAŹ',
      weekday: 'ND',
      day: '25',
    })
  })

  it('brak daty daje placeholder, nie "Invalid Date"', () => {
    expect(formatDayBadge(null)).toEqual({
      month: NO_DATA,
      weekday: NO_DATA,
      day: NO_DATA,
    })
  })
})

describe('formatDate', () => {
  it('formatuje trzy style', () => {
    expect(formatDate('2026-08-22', 'short')).toBe('22.08.2026')
    expect(formatDate('2026-08-22', 'long')).toBe('22 sierpnia 2026')
    expect(formatDate('2026-08-22', 'dayMonth')).toBe('22 sie')
  })

  it('dni graniczne miesiąca zostają w swoim miesiącu', () => {
    expect(formatDate('2026-08-01', 'short')).toBe('01.08.2026')
    expect(formatDate('2026-08-31', 'short')).toBe('31.08.2026')
    expect(formatDate('2026-01-01', 'short')).toBe('01.01.2026')
  })

  it('dni zmiany czasu nie przesuwają się', () => {
    expect(formatDate('2026-03-29', 'short')).toBe('29.03.2026')
    expect(formatDate('2026-10-25', 'short')).toBe('25.10.2026')
  })

  it('brak daty daje placeholder', () => {
    expect(formatDate(null, 'short')).toBe(NO_DATA)
    expect(formatDate(undefined, 'long')).toBe(NO_DATA)
  })
})

describe('hydracja', () => {
  /**
   * Serwer Next.js renderuje w UTC, przeglądarka użytkownika w Europe/Warsaw.
   * Rozjazd między nimi to błąd hydracji — output MUSI być identyczny.
   */
  it('ten sam input daje identyczny output w każdej strefie procesu', async () => {
    const renders: string[][] = []

    for (const tz of ['UTC', 'Europe/Warsaw', 'America/New_York']) {
      vi.stubEnv('TZ', tz)
      vi.resetModules()
      const format = await import('@/lib/format')
      const badge = format.formatDayBadge('2026-08-12')
      renders.push([
        format.formatDate('2026-08-12', 'short'),
        format.formatDate('2026-01-01', 'long'),
        format.formatDate('2026-12-31', 'dayMonth'),
        `${badge.month}|${badge.weekday}|${badge.day}`,
        format.formatMonthTitle('2026-08'),
        format.formatIsoWeek('2026-08-22'),
        format.formatDateRange('2026-08-17', '2026-08-23'),
      ])
    }

    vi.unstubAllEnvs()
    expect(renders[1]).toEqual(renders[0])
    expect(renders[2]).toEqual(renders[0])
  })
})

describe('parseIsoDate', () => {
  it('przyjmuje poprawne "YYYY-MM-DD"', () => {
    expect(parseIsoDate('2026-08-12').toISOString()).toBe('2026-08-12T12:00:00.000Z')
  })

  it('odrzuca wejście, które nie jest kalendarzową datą ISO', () => {
    expect(() => parseIsoDate('2026-8-1')).toThrow()
    expect(() => parseIsoDate('')).toThrow()
    expect(() => parseIsoDate('2026-13-01')).toThrow()
    expect(() => parseIsoDate('2026-02-30')).toThrow()
  })
})

describe('formatMonthTitle', () => {
  it('formatuje "YYYY-MM" wielką literą', () => {
    expect(formatMonthTitle('2026-08')).toBe('Sierpień 2026')
    expect(formatMonthTitle('2026-01')).toBe('Styczeń 2026')
    expect(formatMonthTitle('2026-12')).toBe('Grudzień 2026')
  })

  it('brak miesiąca daje placeholder', () => {
    expect(formatMonthTitle(null)).toBe(NO_DATA)
  })
})

describe('formatWeekday', () => {
  it('formatuje skrót bez kropki i pełną nazwę', () => {
    expect(formatWeekday('2026-08-12', 'short')).toBe('śr')
    expect(formatWeekday('2026-08-12', 'long')).toBe('środa')
    expect(formatWeekday('2026-08-15', 'long')).toBe('sobota')
  })
})

describe('formatIsoWeek', () => {
  it('obie prezentacje niosą ten sam numer tygodnia', () => {
    expect(formatIsoWeek('2026-08-22')).toBe('KW 34/2026')
    expect(formatIsoWeekShort('2026-08-22')).toBe('W34')
  })

  it('tydzień ISO zaczyna się w poniedziałek', () => {
    // 2026-08-16 to niedziela — jeszcze tydzień 33, 2026-08-17 to poniedziałek — już 34.
    expect(formatIsoWeekShort('2026-08-16')).toBe('W33')
    expect(formatIsoWeekShort('2026-08-17')).toBe('W34')
  })

  it('na przełomie roku bierze rok ISO, nie kalendarzowy', () => {
    expect(formatIsoWeek('2027-01-01')).toBe('KW 53/2026')
  })
})

describe('formatDateRange', () => {
  it('skraca wspólny miesiąc i rok', () => {
    expect(formatDateRange('2026-08-17', '2026-08-23')).toBe('17-23.08.2026')
  })

  it('przy różnych miesiącach powtarza miesiąc, przy różnych latach — rok', () => {
    expect(formatDateRange('2026-08-28', '2026-09-03')).toBe('28.08-03.09.2026')
    expect(formatDateRange('2026-12-28', '2027-01-03')).toBe('28.12.2026-03.01.2027')
  })

  it('brak którejkolwiek granicy daje placeholder', () => {
    expect(formatDateRange(null, '2026-08-23')).toBe(NO_DATA)
  })
})

describe('formatRelativeDay', () => {
  it('nazywa dni sąsiednie, resztę liczy', () => {
    expect(formatRelativeDay('2026-08-22', '2026-08-22')).toBe('dziś')
    expect(formatRelativeDay('2026-08-21', '2026-08-22')).toBe('wczoraj')
    expect(formatRelativeDay('2026-08-23', '2026-08-22')).toBe('jutro')
    expect(formatRelativeDay('2026-08-29', '2026-08-22')).toBe('za 7 dni')
    expect(formatRelativeDay('2026-08-15', '2026-08-22')).toBe('7 dni temu')
  })

  it('brak daty daje placeholder', () => {
    expect(formatRelativeDay(null, '2026-08-22')).toBe(NO_DATA)
  })
})
