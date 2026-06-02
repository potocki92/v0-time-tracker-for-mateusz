import { describe, it, expect } from 'vitest'
import {
  getISOWeekNumber,
  getISOWeekYear,
  getWeekRange,
  getWeekStart,
} from '@/lib/date/week'

// Konstruujemy daty lokalnie (getWeekStart/getISOWeek* działają na komponentach
// lokalnej daty), więc new Date(y, m-1, d) jest spójne z implementacją.
const date = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

describe('getWeekRange', () => {
  it('zwraca poniedziałek–niedzielę dla daty w środku tygodnia', () => {
    const { start, end } = getWeekRange(date('2026-06-03')) // środa
    expect(getWeekStart(start).getDay()).toBe(1) // poniedziałek
    expect(start.getDate()).toBe(1) // pon 01.06.2026
    expect(end.getDate()).toBe(7) // ndz 07.06.2026
    expect(end.getMonth()).toBe(5)
  })

  it('dla niedzieli zwraca tydzień, który właśnie się kończy (poniedziałek wstecz)', () => {
    const { start, end } = getWeekRange(date('2026-06-07')) // niedziela
    expect(start.getDate()).toBe(1)
    expect(end.getDate()).toBe(7)
  })
})

describe('getISOWeekNumber', () => {
  it('liczy numer tygodnia ISO w środku roku', () => {
    expect(getISOWeekNumber(date('2026-06-03'))).toBe(23)
  })

  it('1 stycznia 2026 (czwartek) należy do tygodnia 1', () => {
    expect(getISOWeekNumber(date('2026-01-01'))).toBe(1)
    expect(getISOWeekYear(date('2026-01-01'))).toBe(2026)
  })

  it('31 grudnia 2026 (czwartek) należy do tygodnia 53', () => {
    expect(getISOWeekNumber(date('2026-12-31'))).toBe(53)
    expect(getISOWeekYear(date('2026-12-31'))).toBe(2026)
  })

  it('1 stycznia 2023 (niedziela) należy do tygodnia 52 roku ISO 2022', () => {
    expect(getISOWeekNumber(date('2023-01-01'))).toBe(52)
    expect(getISOWeekYear(date('2023-01-01'))).toBe(2022)
  })
})
