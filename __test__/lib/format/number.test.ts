import { describe, expect, it } from 'vitest'
import { createFormat, NO_DATA } from '@/lib/format'

/** Testy warstwy formatowania jada na jezyku bazowym; wersje DE/EN maja wlasny plik. */
const fmt = createFormat('pl')

const ws = (value: string) => value.replace(/[  ]/g, ' ')

describe('formatHours', () => {
  it('całkowite bez miejsc po przecinku, niecałkowite z jednym', () => {
    expect(fmt.hours(240)).toBe('240 h')
    expect(fmt.hours(182)).toBe('182 h')
    expect(fmt.hours(9.6)).toBe('9,6 h')
  })

  it('zero to dana, null to brak danej', () => {
    expect(fmt.hours(0)).toBe('0 h')
    expect(fmt.hours(null)).toBe(NO_DATA)
  })

  it('separatorem dziesiętnym jest przecinek, nie kropka', () => {
    expect(fmt.hours(9.6)).not.toContain('.')
    expect(ws(fmt.hours(1240))).toBe('1 240 h')
  })

  it('opts.decimals wymusza liczbę miejsc', () => {
    expect(fmt.hours(240, { decimals: 1 })).toBe('240,0 h')
    expect(fmt.hours(9.6, { decimals: 0 })).toBe('10 h')
  })
})

describe('formatPercent', () => {
  it('poniżej celu zaokrągla W DÓŁ', () => {
    expect(fmt.percent(0.913)).toBe('91%')
    expect(fmt.percent(0.996)).toBe('99%')
    expect(fmt.percent(0.999999)).toBe('99%')
  })

  it('cel osiągnięty i przekroczony liczy normalnie', () => {
    expect(fmt.percent(1)).toBe('100%')
    expect(fmt.percent(1.14)).toBe('114%')
  })

  it('opts.max przycina wartość', () => {
    expect(fmt.percent(1.14, { max: 100 })).toBe('100%')
  })

  it('zero to dana, null to brak danej', () => {
    expect(fmt.percent(0)).toBe('0%')
    expect(fmt.percent(null)).toBe(NO_DATA)
  })
})

describe('formatCount', () => {
  it('odmienia rzeczownik po polsku', () => {
    const days: [string, string, string] = ['dzień', 'dni', 'dni']
    expect(fmt.count(1, days)).toBe('1 dzień')
    expect(fmt.count(2, days)).toBe('2 dni')
    expect(fmt.count(5, days)).toBe('5 dni')
    expect(fmt.count(22, days)).toBe('22 dni')
    expect(fmt.count(0, days)).toBe('0 dni')
  })

  it('radzi sobie z formami o różnych rdzeniach', () => {
    const entries: [string, string, string] = ['wpis', 'wpisy', 'wpisów']
    expect(fmt.count(1, entries)).toBe('1 wpis')
    expect(fmt.count(3, entries)).toBe('3 wpisy')
    expect(fmt.count(11, entries)).toBe('11 wpisów')
  })
})
