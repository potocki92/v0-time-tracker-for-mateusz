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