import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STATEMENT_PRESET,
  quarterOfMonth,
  resolveStatementRange,
  workWindowOf,
} from '@/features/accounting/domain'

const TODAY = '2026-05-14'

describe('zakresy wykazu', () => {
  it('domyslny preset to rok ZAMKNIETY — wykaz powstaje po zakonczeniu roku', () => {
    expect(DEFAULT_STATEMENT_PRESET).toBe('lastYear')
    expect(resolveStatementRange('lastYear', TODAY, '', '')).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    })
  })

  it('biezacy rok konczy sie 31 grudnia, a nie dzisiaj — to dokument za OKRES', () => {
    expect(resolveStatementRange('thisYear', TODAY, '', '')).toEqual({
      start: '2026-01-01',
      end: '2026-12-31',
    })
  })

  it('kwartaly sa pelne i domkniete obustronnie', () => {
    expect(resolveStatementRange('thisQuarter', TODAY, '', '')).toEqual({
      start: '2026-04-01',
      end: '2026-06-30',
    })
    expect(resolveStatementRange('lastQuarter', TODAY, '', '')).toEqual({
      start: '2026-01-01',
      end: '2026-03-31',
    })
  })

  it('poprzedni kwartal w styczniu cofa sie do Q4 poprzedniego roku', () => {
    expect(resolveStatementRange('lastQuarter', '2026-01-20', '', '')).toEqual({
      start: '2025-10-01',
      end: '2025-12-31',
    })
  })

  it('zakres wlasny bez dat cofa sie do poprzedniego roku, a odwrocony prostuje sie', () => {
    expect(resolveStatementRange('custom', TODAY, '', '')).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    })
    expect(resolveStatementRange('custom', TODAY, '2026-03-31', '2026-01-01')).toEqual({
      start: '2026-01-01',
      end: '2026-03-31',
    })
  })

  it('kwartal liczy sie od 1 dla miesiaca liczonego od 1', () => {
    expect([1, 3, 4, 6, 7, 9, 10, 12].map(quarterOfMonth)).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
  })
})

describe('okno wpisow pracy', () => {
  const range = { start: '2025-01-01', end: '2025-12-31' }

  it('poszerza sie o okresy uslug wychodzace poza zakres wykazu', () => {
    // Faktura ze stycznia za grudniowa prace: bez poszerzenia okna kolumna
    // „gdzie" bylaby pusta dokladnie dla faktur przechodzacych przez granice roku.
    expect(
      workWindowOf(range, [
        { start: '2024-12-23', end: '2025-01-05' },
        { start: '2025-12-29', end: '2026-01-04' },
      ]),
    ).toEqual({ start: '2024-12-23', end: '2026-01-04' })
  })

  it('faktury bez okresu nie ruszaja okna', () => {
    expect(workWindowOf(range, [null, null])).toEqual(range)
  })
})
