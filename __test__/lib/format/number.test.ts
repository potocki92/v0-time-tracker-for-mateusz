import { describe, expect, it } from 'vitest'
import { formatCount, formatHours, formatPercent, NO_DATA } from '@/lib/format'

const ws = (value: string) => value.replace(/[  ]/g, ' ')

describe('formatHours', () => {
  it('całkowite bez miejsc po przecinku, niecałkowite z jednym', () => {
    expect(formatHours(240)).toBe('240 h')
    expect(formatHours(182)).toBe('182 h')
    expect(formatHours(9.6)).toBe('9,6 h')
  })

  it('zero to dana, null to brak danej', () => {
    expect(formatHours(0)).toBe('0 h')
    expect(formatHours(null)).toBe(NO_DATA)
  })

  it('separatorem dziesiętnym jest przecinek, nie kropka', () => {
    expect(formatHours(9.6)).not.toContain('.')
    expect(ws(formatHours(1240))).toBe('1 240 h')
  })

  it('opts.decimals wymusza liczbę miejsc', () => {
    expect(formatHours(240, { decimals: 1 })).toBe('240,0 h')
    expect(formatHours(9.6, { decimals: 0 })).toBe('10 h')
  })
})

describe('formatPercent', () => {
  it('poniżej celu zaokrągla W DÓŁ', () => {
    expect(formatPercent(0.913)).toBe('91%')
    expect(formatPercent(0.996)).toBe('99%')
    expect(formatPercent(0.999999)).toBe('99%')
  })

  it('cel osiągnięty i przekroczony liczy normalnie', () => {
    expect(formatPercent(1)).toBe('100%')
    expect(formatPercent(1.14)).toBe('114%')
  })

  it('opts.max przycina wartość', () => {
    expect(formatPercent(1.14, { max: 100 })).toBe('100%')
  })

  it('zero to dana, null to brak danej', () => {
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(null)).toBe(NO_DATA)
  })
})

describe('formatCount', () => {
  it('odmienia rzeczownik po polsku', () => {
    const days: [string, string, string] = ['dzień', 'dni', 'dni']
    expect(formatCount(1, days)).toBe('1 dzień')
    expect(formatCount(2, days)).toBe('2 dni')
    expect(formatCount(5, days)).toBe('5 dni')
    expect(formatCount(22, days)).toBe('22 dni')
    expect(formatCount(0, days)).toBe('0 dni')
  })

  it('radzi sobie z formami o różnych rdzeniach', () => {
    const entries: [string, string, string] = ['wpis', 'wpisy', 'wpisów']
    expect(formatCount(1, entries)).toBe('1 wpis')
    expect(formatCount(3, entries)).toBe('3 wpisy')
    expect(formatCount(11, entries)).toBe('11 wpisów')
  })
})
