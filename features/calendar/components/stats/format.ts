export function pluralizeDays(n: number): string {
  return n === 1 ? 'dzień' : 'dni'
}

/** Grosze/centy → jednostki główne dla `formatCurrency`. */
export function toMajorUnits(minor: number): number {
  return minor / 100
}
