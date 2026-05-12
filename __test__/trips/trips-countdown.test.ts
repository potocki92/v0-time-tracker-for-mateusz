import { describe, it, expect } from 'vitest'
import {
  addDaysIso,
  computeTripCountdown,
  diffDays,
  formatPlLongDate,
  pluralizeDni,
  type Trip,
} from '@/features/trips/domain'

const trip = (start: string, end: string, destination?: string): Trip => ({
  id: `${start}-${end}`,
  startDate: start,
  endDate: end,
  destination,
})

describe('computeTripCountdown', () => {
  it('na 12.05 dla wyjazdu 11.05 → 30.05 pokazuje 18 dni do powrotu', () => {
    // endDate (30.05) to dzień powrotu — Mateusz pracuje w sobotę i tego
    // samego dnia po pracy zjeżdża do Polski. Stąd 30 - 12 = 18, a nie 19.
    const state = computeTripCountdown(
      [trip('2026-05-11', '2026-05-30', 'Niemcy')],
      '2026-05-12',
    )
    expect(state.mode).toBe('away')
    expect(state.targetDate).toBe('2026-05-30')
    expect(state.days).toBe(18)
    expect(state.trip?.destination).toBe('Niemcy')
  })

  it('w dniu powrotu (endDate) pokazuje 0 dni', () => {
    const state = computeTripCountdown(
      [trip('2026-05-11', '2026-05-30')],
      '2026-05-30',
    )
    expect(state.mode).toBe('away')
    expect(state.days).toBe(0)
  })

  it('dzień po endDate przełącza tryb na "home"', () => {
    const state = computeTripCountdown(
      [
        trip('2026-05-11', '2026-05-30'),
        trip('2026-06-15', '2026-07-04'),
      ],
      '2026-05-31',
    )
    expect(state.mode).toBe('home')
    expect(state.targetDate).toBe('2026-06-15')
    expect(state.days).toBe(15)
  })

  it('w domu odlicza do najbliższego wyjazdu', () => {
    const state = computeTripCountdown(
      [
        trip('2026-05-11', '2026-05-30'),
        trip('2026-06-15', '2026-07-04'),
      ],
      '2026-06-01',
    )
    expect(state.mode).toBe('home')
    expect(state.targetDate).toBe('2026-06-15')
    expect(state.days).toBe(14)
  })

  it('zwraca no_trips, gdy lista jest pusta', () => {
    expect(computeTripCountdown([], '2026-06-01').mode).toBe('no_trips')
  })

  it('zwraca no_trips, gdy wszystkie wyjazdy są zakończone', () => {
    const state = computeTripCountdown(
      [trip('2026-05-11', '2026-05-30')],
      '2026-07-01',
    )
    expect(state.mode).toBe('no_trips')
  })

  it('ignoruje wpisy z odwróconymi datami', () => {
    const state = computeTripCountdown(
      [
        trip('2026-08-01', '2026-07-01'), // invalid
        trip('2026-06-15', '2026-07-04'),
      ],
      '2026-06-01',
    )
    expect(state.mode).toBe('home')
    expect(state.targetDate).toBe('2026-06-15')
  })
})

describe('helpers', () => {
  it('diffDays liczy różnicę całkowitych dni', () => {
    expect(diffDays('2026-05-25', '2026-05-31')).toBe(6)
    expect(diffDays('2026-05-31', '2026-05-25')).toBe(-6)
  })

  it('addDaysIso przesuwa datę o N dni', () => {
    expect(addDaysIso('2026-05-30', 1)).toBe('2026-05-31')
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('formatPlLongDate zwraca dzień tygodnia po polsku', () => {
    expect(formatPlLongDate('2026-05-31')).toBe('niedziela, 31 maja')
  })

  it('pluralizeDni rozróżnia 1 vs resztę', () => {
    expect(pluralizeDni(1)).toBe('dzień')
    expect(pluralizeDni(2)).toBe('dni')
    expect(pluralizeDni(5)).toBe('dni')
    expect(pluralizeDni(0)).toBe('dni')
  })
})
