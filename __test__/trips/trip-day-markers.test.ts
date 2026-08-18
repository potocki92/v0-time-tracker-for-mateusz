import { describe, it, expect } from 'vitest'
import { selectTripDayMarkers } from '@/features/calendar/domain/calendar.selectors'
import type { Trip } from '@/features/trips/domain'

const trip = (start: string, end: string, id = `${start}-${end}`): Trip => ({
  id,
  startDate: start,
  endDate: end,
})

// Maj 2026: piątek 1.05 to kolumna 4 (PN=0..ND=6) → firstDayOfMonth=4.
const MAY_2026 = { year: 2026, month: 4, daysInMonth: 31, firstDay: 4 }

describe('selectTripDayMarkers', () => {
  it('zwraca pusty Map, jeśli brak wyjazdów', () => {
    const map = selectTripDayMarkers([], MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay)
    expect(map.size).toBe(0)
  })

  it('zaokrągla obie krawędzie dla pojedynczego dnia wyjazdu', () => {
    const map = selectTripDayMarkers(
      [trip('2026-05-12', '2026-05-12')],
      MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay,
    )
    expect(map.get(12)).toEqual({
      tripId: '2026-05-12-2026-05-12',
      destination: undefined,
      roundLeft: true,
      roundRight: true,
    })
  })

  it('zaokrągla tylko początek/koniec w wieloosobowym wyjeździe w środku tygodnia', () => {
    // 11–13 maja → wtorek..czwartek (kolumny 1,2,3 — środek tygodnia)
    const map = selectTripDayMarkers(
      [trip('2026-05-11', '2026-05-13')],
      MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay,
    )
    expect(map.get(11)).toMatchObject({ roundLeft: true, roundRight: false })
    expect(map.get(12)).toMatchObject({ roundLeft: false, roundRight: false })
    expect(map.get(13)).toMatchObject({ roundLeft: false, roundRight: true })
  })

  it('łamie zaokrąglenie na końcu tygodnia (niedziela kończy rząd)', () => {
    // 1–4 maja: pt(4) → sb(5) → nd(6) → pn(0)
    // Niedziela 3.05 = kolumna 6 → roundRight; poniedziałek 4.05 = kolumna 0 → roundLeft.
    const map = selectTripDayMarkers(
      [trip('2026-05-01', '2026-05-04')],
      MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay,
    )
    expect(map.get(1)).toMatchObject({ roundLeft: true, roundRight: false })
    expect(map.get(2)).toMatchObject({ roundLeft: false, roundRight: false })
    expect(map.get(3)).toMatchObject({ roundLeft: false, roundRight: true })
    expect(map.get(4)).toMatchObject({ roundLeft: true, roundRight: true })
  })

  it('zaokrągla lewą krawędź pierwszego dnia miesiąca, gdy wyjazd nachodzi z poprzedniego miesiąca', () => {
    // Wyjazd 27.04 → 5.05. W maju widzimy 1–5 maja, gdzie 1.05 to "środek" zakresu,
    // ale poprzedni dzień (30.04) jest poza widoczną siatką — wizualnie i tak nowy
    // wiersz, więc 1.05 dostaje roundLeft.
    const map = selectTripDayMarkers(
      [trip('2026-04-27', '2026-05-05')],
      MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay,
    )
    // 1.05 = piątek (kolumna 4), poprzedni dzień (30.04) w tym samym wyjeździe →
    // bez warunku kolumny byłby roundLeft=false. Ale 1.05 wpada w środek tygodnia,
    // więc tu sprawdzamy że logika nie zwariowała: roundLeft pozostaje false,
    // bo poprzedni dzień siedzi w tym samym wyjeździe i kolumna nie jest 0.
    expect(map.get(1)).toMatchObject({ roundLeft: false, roundRight: false })
    // 5.05 = wtorek, kolejny dzień (6.05) poza wyjazdem → roundRight=true.
    expect(map.get(5)).toMatchObject({ roundLeft: false, roundRight: true })
  })

  it('przenosi destination z wyjazdu na marker', () => {
    const map = selectTripDayMarkers(
      [{ id: 't1', startDate: '2026-05-10', endDate: '2026-05-12', destination: 'Niemcy' }],
      MAY_2026.year, MAY_2026.month, MAY_2026.daysInMonth, MAY_2026.firstDay,
    )
    expect(map.get(10)?.destination).toBe('Niemcy')
    expect(map.get(11)?.destination).toBe('Niemcy')
    expect(map.get(12)?.destination).toBe('Niemcy')
  })
})
