export function eurToPln(amount: number, rate: number) {
  return amount * rate
}

export function plnToEur(amount: number, rate: number) {
  if (rate === 0) return 0
  return amount / rate
}

export function normalizeRate(rate?: number | null, fallback = 4.3) {
  if (!rate || rate <= 0) return fallback
  return rate
}