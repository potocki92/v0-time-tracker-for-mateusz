import type { CURRENCY } from '@/lib/types'

/**
 * Money represents an exact amount in a currency's minor unit (grosze/cents) as a bigint.
 * All arithmetic is integer-based to avoid float rounding errors (e.g. 0.1 + 0.2 !== 0.3).
 *
 * Conversions between currencies use rate in basis points (1/10_000) for integer math.
 */
export interface Money {
  readonly amountMinor: bigint
  readonly currency: CURRENCY
}

const ZERO = BigInt(0)
const ONE = BigInt(1)
const TWO = BigInt(2)
const MINOR_UNIT_FACTOR = BigInt(100)
const RATE_BPS_FACTOR = BigInt(10_000)
const FACTOR_SCALE = BigInt(1_000_000)

function assertSameCurrency(a: Money, b: Money, op: string): void {
  if (a.currency !== b.currency) {
    throw new Error(`Money.${op}: currency mismatch ${a.currency} vs ${b.currency}`)
  }
}

function toBigIntRounded(value: number): bigint {
  if (!Number.isFinite(value)) {
    throw new Error(`Money: value is not finite: ${value}`)
  }
  return BigInt(Math.round(value))
}

/** Build Money from a major-unit number (e.g. 12.34 PLN). Rounds half away from zero. */
export function fromMajor(amount: number, currency: CURRENCY): Money {
  if (!Number.isFinite(amount)) {
    return { amountMinor: ZERO, currency }
  }
  const minor = toBigIntRounded(amount * 100)
  return { amountMinor: minor, currency }
}

/** Build Money directly from minor units (e.g. 1234n for 12.34 PLN). */
export function fromMinor(amountMinor: bigint | number, currency: CURRENCY): Money {
  const minor = typeof amountMinor === 'bigint' ? amountMinor : toBigIntRounded(amountMinor)
  return { amountMinor: minor, currency }
}

/** Zero in the given currency. */
export function zero(currency: CURRENCY): Money {
  return { amountMinor: ZERO, currency }
}

/** Convert back to a major-unit number. Precise within Number.MAX_SAFE_INTEGER; safe for real-world invoice amounts. */
export function toMajor(m: Money): number {
  const whole = m.amountMinor / MINOR_UNIT_FACTOR
  const frac = m.amountMinor % MINOR_UNIT_FACTOR
  const fracAbs = frac < ZERO ? -frac : frac
  const sign = m.amountMinor < ZERO ? -1 : 1
  return Number(whole) + (sign * Number(fracAbs)) / 100
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b, 'add')
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency }
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b, 'subtract')
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency }
}

export function sum(items: Money[], currency: CURRENCY): Money {
  let acc = ZERO
  for (const m of items) {
    if (m.currency !== currency) {
      throw new Error(`Money.sum: expected ${currency}, got ${m.currency}`)
    }
    acc += m.amountMinor
  }
  return { amountMinor: acc, currency }
}

/** Multiply money by a scalar factor. Factor is a regular number (rate, hours, quantity). */
export function multiply(m: Money, factor: number): Money {
  if (!Number.isFinite(factor) || factor === 0) {
    return { amountMinor: ZERO, currency: m.currency }
  }
  const scaledFactor = toBigIntRounded(factor * 1_000_000)
  const product = m.amountMinor * scaledFactor
  const rounded = roundHalfAwayFromZero(product, FACTOR_SCALE)
  return { amountMinor: rounded, currency: m.currency }
}

/**
 * Convert between currencies. `rate` is the price of 1 unit of `from` in `to`
 * (e.g. for EUR→PLN with eurRate=4.3 pass rate=4.3).
 */
export function convert(m: Money, to: CURRENCY, rate: number): Money {
  if (m.currency === to) return m
  if (!Number.isFinite(rate) || rate <= 0) {
    return { amountMinor: ZERO, currency: to }
  }
  const rateBps = toBigIntRounded(rate * 10_000)
  const converted = roundHalfAwayFromZero(m.amountMinor * rateBps, RATE_BPS_FACTOR)
  return { amountMinor: converted, currency: to }
}

function roundHalfAwayFromZero(value: bigint, divisor: bigint): bigint {
  if (divisor <= ZERO) throw new Error('Money: divisor must be positive')
  const negative = value < ZERO
  const absVal = negative ? -value : value
  const quot = absVal / divisor
  const rem = absVal % divisor
  const rounded = rem * TWO >= divisor ? quot + ONE : quot
  return negative ? -rounded : rounded
}

/** Strictly compare two amounts. Treats different currencies as not equal. */
export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor
}

export function isZero(m: Money): boolean {
  return m.amountMinor === ZERO
}

export function isPositive(m: Money): boolean {
  return m.amountMinor > ZERO
}

/** Format using Intl.NumberFormat. Works in the browser and on the server. */
export function format(m: Money, locale = 'pl-PL'): string {
  const value = toMajor(m)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Build Money from a NUMERIC(12,2) value returned by Supabase. Accepts number | string | null. */
export function fromDb(value: number | string | null | undefined, currency: CURRENCY): Money {
  if (value === null || value === undefined) return zero(currency)
  const asNumber = typeof value === 'string' ? Number(value) : value
  return fromMajor(asNumber, currency)
}

/** Return a number suitable for writing back to a NUMERIC(12,2) column. */
export function toDb(m: Money): number {
  return toMajor(m)
}
