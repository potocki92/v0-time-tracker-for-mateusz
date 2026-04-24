import { convert, fromMajor, toMajor } from './money'

/**
 * Convert an EUR amount to PLN using integer-precise arithmetic under the hood.
 * Signatures are preserved for backwards compatibility.
 */
export function eurToPln(amount: number, rate: number) {
  return toMajor(convert(fromMajor(amount, 'EUR'), 'PLN', rate))
}

export function plnToEur(amount: number, rate: number) {
  if (rate === 0) return 0
  return toMajor(convert(fromMajor(amount, 'PLN'), 'EUR', rate))
}

export function normalizeRate(rate?: number | null, fallback = 4.3) {
  if (!rate || rate <= 0) return fallback
  return rate
}
