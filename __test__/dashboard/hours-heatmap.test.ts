import { describe, it, expect } from 'vitest'
import {
  buildHeatmap,
  levelFromHours,
  HEATMAP_WEEKS,
} from '@/features/dashboard/components/sections/hours/heatmap'
import type { WorkEntry } from '@/lib/types'

function entry(date: string, hours: number, status: WorkEntry['status'] = 'worked'): WorkEntry {
  return {
    id: `e-${date}`,
    user_id: 'u1',
    client_id: 'c1',
    project_id: null,
    date,
    status,
    entry_kind: 'real',
    hours,
    quantity: null,
    quantity_from: null,
    quantity_to: null,
    category: null,
    tags: [],
    notes: null,
    billing_rate: null,
    billing_currency: null,
    billing_work_type: null,
    billing_unit: null,
    created_at: date,
  }
}

/** Sroda, 12 sierpnia 2026, godzina 1 w nocy czasu lokalnego. */
const TODAY = new Date(2026, 7, 12, 1, 0, 0)

describe('buildHeatmap — okno siatki', () => {
  it('ma 52 kolumny po 7 dni, poniedzialek u gory', () => {
    const map = buildHeatmap([], TODAY)
    expect(map.weeks).toHaveLength(HEATMAP_WEEKS)
    for (const week of map.weeks) {
      expect(week.days).toHaveLength(7)
      const [y, m, d] = week.startDate.split('-').map(Number)
      expect(new Date(y, m - 1, d).getDay(), `${week.startDate} nie jest poniedzialkiem`).toBe(1)
    }
  })

  it('ostatnia kolumna to tydzien biezacy, a dni po dzis sa oznaczone jako przyszle', () => {
    const map = buildHeatmap([], TODAY)
    const last = map.weeks[HEATMAP_WEEKS - 1]
    expect(last.startDate).toBe('2026-08-10') // poniedzialek tygodnia z 12.08
    expect(last.days.map((d) => d.isFuture)).toEqual([
      false, false, false, true, true, true, true,
    ])
    expect(last.days.find((d) => d.isToday)?.date).toBe('2026-08-12')
  })

  it('siatka konczy sie na niedzieli biezacego tygodnia — nie gubi dni przeszlych', () => {
    // Poprzednia wersja kotwiczyla sie na niedzieli NADCHODZACEJ liczonej od
    // dzis, wiec w poniedzialek siatka pokazywala 6 pustych dni z przyszlosci.
    const monday = new Date(2026, 7, 10, 12, 0, 0)
    const map = buildHeatmap([], monday)
    expect(map.weeks[HEATMAP_WEEKS - 1].days.at(-1)!.date).toBe('2026-08-16')
    expect(map.weeks[0].days[0].date).toBe('2025-08-18')
  })
})

describe('buildHeatmap — kubelkowanie godzin', () => {
  it('przypisuje godziny do dnia lokalnego, nie do dnia UTC', () => {
    // Klucz szedl wczesniej przez toISOString(), czyli przez UTC: lokalna
    // polnoc w UTC+2 to 22:00 dnia poprzedniego, wiec wpis ladowal o dzien
    // wczesniej. Test jest odporny na strefe, bo porownuje po kluczu wpisu.
    const map = buildHeatmap([entry('2026-08-11', 7.5)], TODAY)
    const cells = map.weeks.flatMap((w) => w.days).filter((d) => d.hours > 0)
    expect(cells).toHaveLength(1)
    expect(cells[0].date).toBe('2026-08-11')
  })

  it('sumuje kilka wpisow tego samego dnia', () => {
    const map = buildHeatmap([entry('2026-08-11', 4), { ...entry('2026-08-11', 3), id: 'e2' }], TODAY)
    const cell = map.weeks.flatMap((w) => w.days).find((d) => d.date === '2026-08-11')
    expect(cell?.hours).toBe(7)
  })

  it('liczy wylacznie dni przepracowane', () => {
    const map = buildHeatmap(
      [entry('2026-08-10', 8, 'vacation'), entry('2026-08-11', 8, 'sick_leave')],
      TODAY,
    )
    expect(map.activeDays).toBe(0)
    expect(map.totalHours).toBe(0)
  })

  it('ignoruje wpisy spoza okna', () => {
    const map = buildHeatmap([entry('2024-01-15', 8)], TODAY)
    expect(map.activeDays).toBe(0)
  })

  it('podaje sume tygodnia dla tabeli czytnika ekranu', () => {
    const map = buildHeatmap([entry('2026-08-10', 6), entry('2026-08-11', 2)], TODAY)
    expect(map.weeks.at(-1)!.totalHours).toBe(8)
    expect(map.activeDays).toBe(2)
    expect(map.totalHours).toBe(8)
  })

  it('oznacza etykieta miesiaca tylko pierwsza kolumne danego miesiaca', () => {
    // Kolumna zerowa zostaje bez etykiety: pierwszy miesiac okna jest uciety,
    // wiec jego napis staje tuz obok nastepnego i oba sie zlewaja.
    const weeks = buildHeatmap([], TODAY).weeks
    const labels = weeks.map((w) => w.monthLabel)
    expect(labels[0]).toBeNull()
    expect(labels.filter(Boolean)).toEqual([
      'wrz', 'paź', 'lis', 'gru', 'sty', 'lut',
      'mar', 'kwi', 'maj', 'cze', 'lip', 'sie',
    ])
  })

  it('etykiety miesiecy nie stoja w sasiednich kolumnach', () => {
    const labelled = buildHeatmap([], TODAY)
      .weeks.map((w, i) => (w.monthLabel ? i : -1))
      .filter((i) => i >= 0)
    for (let i = 1; i < labelled.length; i += 1) {
      expect(
        labelled[i] - labelled[i - 1],
        'dwa napisy miesiaca obok siebie zlewaja sie w jeden',
      ).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('levelFromHours — progi 2 / 5 / 8', () => {
  it.each([
    [0, 0],
    [0.5, 1],
    [1.9, 1],
    [2, 2],
    [4.9, 2],
    [5, 3],
    [7.9, 3],
    [8, 4],
    [12, 4],
  ])('%s h → poziom %s', (hours, level) => {
    expect(levelFromHours(hours)).toBe(level)
  })
})
