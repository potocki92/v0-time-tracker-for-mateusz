import { describe, expect, it } from 'vitest'

import {
  isValidTimeZone,
  parseClockMinutes,
  zonedInstant,
  zonedParts,
} from '@/lib/date/timezone'

/**
 * Strefy IANA zamiast sztywnego "+1h do UTC". Testy pilnuja obu przejsc czasu
 * i granicy polnocy — bez nich przebieg kilka minut po polnocy przypisalby
 * godziny do zlego dnia.
 */

describe('zonedParts', () => {
  it('liczy date i godzine w strefie uzytkownika, nie serwera', () => {
    // 22:30 UTC to juz nastepny dzien w Warszawie (00:30 czasu letniego).
    expect(zonedParts(new Date('2026-09-08T22:30:00Z'), 'Europe/Warsaw')).toEqual({
      date: '2026-09-09',
      minutes: 30,
    })
    expect(zonedParts(new Date('2026-09-08T22:30:00Z'), 'UTC')).toEqual({
      date: '2026-09-08',
      minutes: 22 * 60 + 30,
    })
  })

  it('polnoc lokalna daje 0 minut, nie 1440', () => {
    expect(zonedParts(new Date('2026-09-08T22:00:00Z'), 'Europe/Warsaw')).toEqual({
      date: '2026-09-09',
      minutes: 0,
    })
  })

  it('rozroznia czas letni i zimowy', () => {
    expect(zonedParts(new Date('2026-01-15T12:00:00Z'), 'Europe/Warsaw').minutes).toBe(13 * 60)
    expect(zonedParts(new Date('2026-07-15T12:00:00Z'), 'Europe/Warsaw').minutes).toBe(14 * 60)
  })
})

describe('zonedInstant', () => {
  it('zamienia czas scienny na chwile UTC po obu stronach zmiany czasu', () => {
    expect(zonedInstant('2026-07-15', 19 * 60, 'Europe/Warsaw').toISOString()).toBe(
      '2026-07-15T17:00:00.000Z',
    )
    expect(zonedInstant('2026-01-15', 19 * 60, 'Europe/Warsaw').toISOString()).toBe(
      '2026-01-15T18:00:00.000Z',
    )
  })

  it('godzina, ktora wiosna nie istnieje, wypada PO przeskoku', () => {
    // 29.03.2026 zegary skacza z 02:00 na 03:00 — 02:30 nie istnieje.
    const instant = zonedInstant('2026-03-29', 2 * 60 + 30, 'Europe/Warsaw')
    const local = zonedParts(instant, 'Europe/Warsaw')

    expect(local.date).toBe('2026-03-29')
    expect(local.minutes).toBeGreaterThanOrEqual(3 * 60)
  })

  it('jesienna powtorzona godzina nadal wskazuje wlasciwy dzien', () => {
    // 25.10.2026 zegary cofaja sie z 03:00 na 02:00 — 02:30 wystepuje dwa razy.
    const instant = zonedInstant('2026-10-25', 2 * 60 + 30, 'Europe/Warsaw')
    expect(zonedParts(instant, 'Europe/Warsaw').date).toBe('2026-10-25')
  })
})

describe('isValidTimeZone', () => {
  it('przyjmuje strefy IANA i odrzuca smieci', () => {
    expect(isValidTimeZone('Europe/Warsaw')).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
    expect(isValidTimeZone('Europe/Atlantyda')).toBe(false)
  })
})

describe('parseClockMinutes', () => {
  it('czyta HH:mm i odrzuca wartosci spoza formatu', () => {
    expect(parseClockMinutes('19:00')).toBe(19 * 60)
    expect(parseClockMinutes('00:05')).toBe(5)
    expect(parseClockMinutes('24:00')).toBeNull()
    expect(parseClockMinutes('7:00')).toBeNull()
  })
})
