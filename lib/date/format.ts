export function formatDate(date: Date | string, locale = 'pl-PL') {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString(locale)
}

export function formatMonthYear(date: Date | string, locale = 'pl-PL') {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString(locale, {
    month: 'short',
    year: 'numeric',
  })
}

export function formatCurrency(
  value: number,
  currency: 'PLN' | 'EUR' = 'PLN',
  locale = 'pl-PL'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
