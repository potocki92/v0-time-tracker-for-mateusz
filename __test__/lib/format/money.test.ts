import { describe, expect, it } from 'vitest'
import { createFormat, NO_DATA } from '@/lib/format'

/** Testy warstwy formatowania jada na jezyku bazowym; wersje DE/EN maja wlasny plik. */
const fmt = createFormat('pl')

/**
 * Intl wstawia NBSP (U+00A0) i NNBSP (U+202F) jako separator tysięcy i przed
 * symbolem waluty. Naiwny assert ze zwykłą spacją failuje — normalizujemy.
 */
const ws = (value: string) => value.replace(/[  ]/g, ' ')

describe('formatMoney', () => {
  it('formatuje grosze jako złotówki z separatorem tysięcy', () => {
    expect(ws(fmt.money(1_820_000, 'PLN'))).toBe('18 200,00 zł')
  })

  it('EUR pokazuje kod waluty, nie symbol', () => {
    expect(ws(fmt.money(422_931, 'EUR'))).toBe('4 229,31 EUR')
  })

  it('zero to dana, null to brak danej', () => {
    expect(ws(fmt.money(0, 'PLN'))).toBe('0,00 zł')
    expect(fmt.money(null, 'PLN')).toBe(NO_DATA)
    expect(fmt.money(null, 'EUR')).toBe(NO_DATA)
  })

  it('sumowanie w groszach nie dryfuje', () => {
    const total = 580_000 * 3
    expect(total).toBe(1_740_000)
    expect(ws(fmt.money(total, 'PLN'))).toBe('17 400,00 zł')
  })
})

describe('formatMoneyCompact', () => {
  it('skraca duże kwoty do wąskich kart i osi wykresów', () => {
    expect(ws(fmt.moneyCompact(1_820_000, 'PLN'))).toBe('18,2 tys. zł')
    expect(ws(fmt.moneyCompact(125_000_000, 'EUR'))).toBe('1,3 mln EUR')
  })

  it('brak kwoty daje placeholder', () => {
    expect(fmt.moneyCompact(null, 'PLN')).toBe(NO_DATA)
  })
})

describe('formatRate', () => {
  it('dokleja jednostkę godzinową', () => {
    expect(ws(fmt.rate(10_000, 'PLN'))).toBe('100,00 zł/h')
  })

  it('brak stawki daje placeholder, nigdy "0,00 EUR/h"', () => {
    expect(fmt.rate(null, 'EUR')).toBe(NO_DATA)
  })
})

describe('formatMoneyDelta', () => {
  it('dodatnie dostają plus', () => {
    expect(ws(fmt.moneyDelta(958_523, 'PLN'))).toBe('+9 585,23 zł')
  })

  it('ujemne dostają minus U+2212, nie dywiz', () => {
    const result = ws(fmt.moneyDelta(-120_000, 'PLN'))
    expect(result).toBe('−1 200,00 zł')
    expect(result).not.toContain('-')
  })

  it('zero jest bez znaku, null to placeholder', () => {
    expect(ws(fmt.moneyDelta(0, 'PLN'))).toBe('0,00 zł')
    expect(fmt.moneyDelta(null, 'PLN')).toBe(NO_DATA)
  })
})
