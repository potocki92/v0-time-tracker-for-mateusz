import { describe, it, expect } from 'vitest'
import {
  add,
  convert,
  equals,
  format,
  fromDb,
  fromMajor,
  fromMinor,
  isPositive,
  isZero,
  multiply,
  subtract,
  sum,
  toDb,
  toMajor,
  zero,
} from '@/lib/finance/money'

describe('Money.fromMajor', () => {
  it('rounds half away from zero', () => {
    expect(fromMajor(12.345, 'PLN').amountMinor).toBe(BigInt(1235))
    expect(fromMajor(12.344, 'PLN').amountMinor).toBe(BigInt(1234))
  })

  it('handles negative amounts', () => {
    expect(fromMajor(-12.34, 'PLN').amountMinor).toBe(BigInt(-1234))
  })

  it('handles NaN/Infinity gracefully', () => {
    expect(fromMajor(Number.NaN, 'PLN').amountMinor).toBe(BigInt(0))
    expect(fromMajor(Number.POSITIVE_INFINITY, 'PLN').amountMinor).toBe(BigInt(0))
  })

  it('handles zero and very small fractions', () => {
    expect(fromMajor(0, 'PLN').amountMinor).toBe(BigInt(0))
    expect(fromMajor(0.004, 'PLN').amountMinor).toBe(BigInt(0))
    expect(fromMajor(0.005, 'PLN').amountMinor).toBe(BigInt(1))
  })
})

describe('Money precision (the classic float bugs)', () => {
  it('0.1 + 0.2 equals exactly 0.30', () => {
    const a = fromMajor(0.1, 'PLN')
    const b = fromMajor(0.2, 'PLN')
    expect(toMajor(add(a, b))).toBe(0.3)
    expect(add(a, b).amountMinor).toBe(BigInt(30))
  })

  it('sum of many small amounts stays exact', () => {
    const items = new Array(1000).fill(null).map(() => fromMajor(0.01, 'PLN'))
    const total = sum(items, 'PLN')
    expect(total.amountMinor).toBe(BigInt(1000))
    expect(toMajor(total)).toBe(10)
  })
})

describe('Money.add / subtract', () => {
  it('adds same-currency money', () => {
    expect(toMajor(add(fromMajor(10, 'PLN'), fromMajor(2.5, 'PLN')))).toBe(12.5)
  })

  it('subtracts same-currency money', () => {
    expect(toMajor(subtract(fromMajor(10, 'PLN'), fromMajor(2.5, 'PLN')))).toBe(7.5)
  })

  it('throws on currency mismatch', () => {
    expect(() => add(fromMajor(10, 'PLN'), fromMajor(1, 'EUR'))).toThrow(/mismatch/)
    expect(() => subtract(fromMajor(10, 'PLN'), fromMajor(1, 'EUR'))).toThrow(/mismatch/)
  })
})

describe('Money.sum', () => {
  it('sums zero-element list to zero', () => {
    expect(equals(sum([], 'PLN'), zero('PLN'))).toBe(true)
  })

  it('rejects items of a different currency', () => {
    expect(() => sum([fromMajor(1, 'EUR')], 'PLN')).toThrow(/expected PLN/)
  })
})

describe('Money.multiply', () => {
  it('hours * rate produces a precise amount', () => {
    const rate = fromMajor(123.45, 'PLN')
    const result = multiply(rate, 7.5)
    expect(toMajor(result)).toBe(925.88)
  })

  it('zero or NaN factor yields zero', () => {
    expect(toMajor(multiply(fromMajor(100, 'PLN'), 0))).toBe(0)
    expect(toMajor(multiply(fromMajor(100, 'PLN'), Number.NaN))).toBe(0)
  })

  it('preserves currency', () => {
    expect(multiply(fromMajor(10, 'EUR'), 2).currency).toBe('EUR')
  })
})

describe('Money.convert', () => {
  it('EUR to PLN at rate 4.30', () => {
    const eur = fromMajor(100, 'EUR')
    expect(toMajor(convert(eur, 'PLN', 4.3))).toBe(430)
  })

  it('returns same money when currencies match', () => {
    const pln = fromMajor(12.34, 'PLN')
    expect(equals(convert(pln, 'PLN', 4.3), pln)).toBe(true)
  })

  it('invalid rate returns zero of target currency', () => {
    const eur = fromMajor(100, 'EUR')
    expect(equals(convert(eur, 'PLN', 0), zero('PLN'))).toBe(true)
    expect(equals(convert(eur, 'PLN', -1), zero('PLN'))).toBe(true)
    expect(equals(convert(eur, 'PLN', Number.NaN), zero('PLN'))).toBe(true)
  })

  it('rounds half away from zero on conversion', () => {
    // 1 EUR * 4.335 = 4.335 -> rounds to 4.34
    const eur = fromMajor(1, 'EUR')
    expect(toMajor(convert(eur, 'PLN', 4.335))).toBe(4.34)
  })
})

describe('Money.toMajor / fromDb / toDb', () => {
  it('round-trips from db NUMERIC(12,2)', () => {
    const m = fromDb('1234.56', 'PLN')
    expect(m.amountMinor).toBe(BigInt(123456))
    expect(toDb(m)).toBe(1234.56)
  })

  it('accepts numeric input from db', () => {
    expect(toDb(fromDb(42, 'EUR'))).toBe(42)
  })

  it('handles null/undefined from db', () => {
    expect(isZero(fromDb(null, 'PLN'))).toBe(true)
    expect(isZero(fromDb(undefined, 'EUR'))).toBe(true)
  })
})

describe('Money predicates', () => {
  it('isZero/isPositive', () => {
    expect(isZero(zero('PLN'))).toBe(true)
    expect(isPositive(fromMajor(0.01, 'PLN'))).toBe(true)
    expect(isPositive(fromMajor(-0.01, 'PLN'))).toBe(false)
  })
})

describe('Money.format', () => {
  it('formats PLN with Polish locale', () => {
    const formatted = format(fromMajor(1234.5, 'PLN'))
    // Non-breaking/narrow-no-break spaces vary by runtime — just assert key chars.
    expect(formatted).toMatch(/1.?234,50/)
    expect(formatted).toMatch(/zł|PLN/)
  })

  it('formats EUR', () => {
    const formatted = format(fromMajor(99, 'EUR'))
    expect(formatted).toMatch(/99,00/)
  })
})

describe('Money.fromMinor', () => {
  it('accepts bigint directly', () => {
    const m = fromMinor(BigInt(1234), 'PLN')
    expect(m.amountMinor).toBe(BigInt(1234))
  })

  it('accepts number and rounds', () => {
    const m = fromMinor(1234.7, 'PLN')
    expect(m.amountMinor).toBe(BigInt(1235))
  })
})
