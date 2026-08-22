import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  formatMoneyCompact,
  formatMoneyDelta,
  formatRate,
  NO_DATA,
} from '@/lib/format'

/**
 * Intl wstawia NBSP (U+00A0) i NNBSP (U+202F) jako separator tysięcy i przed
 * symbolem waluty. Naiwny assert ze zwykłą spacją failuje — normalizujemy.
 */
const ws = (value: string) => value.replace(/[  ]/g, ' ')

describe('formatMoney', () => {
  it('formatuje grosze jako złotówki z separatorem tysięcy', () => {
    expect(ws(formatMoney(1_820_000, 'PLN'))).toBe('18 200,00 zł')
  })

  it('EUR pokazuje kod waluty, nie symbol', () => {
    expect(ws(formatMoney(422_931, 'EUR'))).toBe('4 229,31 EUR')
  })

  it('zero to dana, null to brak danej', () => {
    expect(ws(formatMoney(0, 'PLN'))).toBe('0,00 zł')
    expect(formatMoney(null, 'PLN')).toBe(NO_DATA)
    expect(formatMoney(null, 'EUR')).toBe(NO_DATA)
  })

  it('sumowanie w groszach nie dryfuje', () => {
    const total = 580_000 * 3
    expect(total).toBe(1_740_000)
    expect(ws(formatMoney(total, 'PLN'))).toBe('17 400,00 zł')
  })
})

describe('formatMoneyCompact', () => {
  it('skraca duże kwoty do wąskich kart i osi wykresów', () => {
    expect(ws(formatMoneyCompact(1_820_000, 'PLN'))).toBe('18,2 tys. zł')
    expect(ws(formatMoneyCompact(125_000_000, 'EUR'))).toBe('1,3 mln EUR')
  })

  it('brak kwoty daje placeholder', () => {
    expect(formatMoneyCompact(null, 'PLN')).toBe(NO_DATA)
  })
})

describe('formatRate', () => {
  it('dokleja jednostkę godzinową', () => {
    expect(ws(formatRate(10_000, 'PLN'))).toBe('100,00 zł/h')
  })

  it('brak stawki daje placeholder, nigdy "0,00 EUR/h"', () => {
    expect(formatRate(null, 'EUR')).toBe(NO_DATA)
  })
})

describe('formatMoneyDelta', () => {
  it('dodatnie dostają plus', () => {
    expect(ws(formatMoneyDelta(958_523, 'PLN'))).toBe('+9 585,23 zł')
  })

  it('ujemne dostają minus U+2212, nie dywiz', () => {
    const result = ws(formatMoneyDelta(-120_000, 'PLN'))
    expect(result).toBe('−1 200,00 zł')
    expect(result).not.toContain('-')
  })

  it('zero jest bez znaku, null to placeholder', () => {
    expect(ws(formatMoneyDelta(0, 'PLN'))).toBe('0,00 zł')
    expect(formatMoneyDelta(null, 'PLN')).toBe(NO_DATA)
  })
})
