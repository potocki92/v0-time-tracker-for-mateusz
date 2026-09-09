import { describe, expect, it } from 'vitest'

import { APP_LOCALES } from '@/i18n/config'
import { createFormat } from '@/lib/format'

/**
 * Format prezentacji idzie za jezykiem interfejsu; SEMANTYKA wartosci nie.
 *
 * 100 EUR zostaje 100 EUR w kazdym jezyku — zmienia sie zapis liczby i
 * pozycja symbolu, nigdy waluta. Tak samo data: ta sama doba, inny zapis.
 */
const ws = (value: string) => value.replace(/[  ]/g, ' ')

describe('kwoty — jeden format na jezyk, jedna waluta na wartosc', () => {
  it('ten sam grosz renderuje sie inaczej w kazdym jezyku', () => {
    const amounts = APP_LOCALES.map((locale) => ws(createFormat(locale).money(123_456, 'EUR')))
    expect(new Set(amounts).size).toBe(APP_LOCALES.length)
  })

  it('polski i niemiecki uzywaja przecinka dziesietnego, angielski kropki', () => {
    expect(ws(createFormat('pl').money(123_456, 'EUR'))).toContain('1 234,56')
    expect(ws(createFormat('de').money(123_456, 'EUR'))).toContain('1.234,56')
    expect(ws(createFormat('en').money(123_456, 'EUR'))).toContain('1,234.56')
  })

  it('zmiana jezyka NIE zmienia waluty', () => {
    for (const locale of APP_LOCALES) {
      expect(ws(createFormat(locale).money(10_000, 'EUR'))).toMatch(/€|EUR/)
      expect(ws(createFormat(locale).money(10_000, 'PLN'))).toMatch(/zł|PLN/)
    }
  })
})

describe('daty — ten sam dzien, inny zapis', () => {
  it('9 wrzesnia 2026 w trzech jezykach', () => {
    expect(createFormat('pl').date('2026-09-09', 'long')).toBe('9 września 2026')
    expect(createFormat('de').date('2026-09-09', 'long')).toBe('9. September 2026')
    expect(createFormat('en').date('2026-09-09', 'long')).toBe('9 September 2026')
  })

  it('nazwa miesiaca idzie za jezykiem', () => {
    expect(createFormat('pl').monthTitle('2026-09')).toBe('Wrzesień 2026')
    expect(createFormat('de').monthTitle('2026-09')).toBe('September 2026')
    expect(createFormat('en').monthTitle('2026-09')).toBe('September 2026')
  })

  it('kafelek daty ma dwuliterowy skrot dnia w kazdym jezyku', () => {
    // 2026-09-09 to sroda.
    expect(createFormat('pl').dayBadge('2026-09-09').weekday).toBe('ŚR')
    expect(createFormat('de').dayBadge('2026-09-09').weekday).toBe('MI')
    expect(createFormat('en').dayBadge('2026-09-09').weekday).toBe('WE')
  })

  it('strefa konta NIE idzie za jezykiem — data nie przeskakuje', () => {
    // Ta sama doba kalendarzowa w kazdym jezyku: zmienia sie zapis, nie dzien.
    for (const locale of APP_LOCALES) {
      expect(createFormat(locale).date('2026-01-01', 'short')).toMatch(/01/)
      expect(createFormat(locale).date('2026-12-31', 'short')).toMatch(/31/)
    }
  })
})

describe('liczby i procenty', () => {
  it('godziny uzywaja separatora wlasciwego dla jezyka', () => {
    expect(ws(createFormat('pl').hours(1234.5))).toBe('1 234,5 h')
    expect(ws(createFormat('de').hours(1234.5))).toBe('1.234,5 h')
    expect(ws(createFormat('en').hours(1234.5))).toBe('1,234.5 h')
  })

  it('procent jest procentem wszedzie', () => {
    for (const locale of APP_LOCALES) {
      expect(createFormat(locale).percent(0.5)).toContain('50')
    }
  })
})

describe('tydzien ISO', () => {
  it('numer tygodnia jest ten sam, prefiks idzie za jezykiem', () => {
    expect(createFormat('pl').isoWeek('2026-09-09')).toBe('KW 37/2026')
    expect(createFormat('de').isoWeek('2026-09-09')).toBe('KW 37/2026')
    expect(createFormat('en').isoWeek('2026-09-09')).toBe('W 37/2026')
  })
})
