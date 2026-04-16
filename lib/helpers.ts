export function formatCurrency(amount: number, currency: 'PLN' | 'EUR'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Convert to Monday = 0
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short'
  })
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number)
  return { year, month: month - 1 }
}


export function generateId(): string {
  return crypto.randomUUID()
}

export function isToday(date: string): boolean {
  const today = new Date()
  const d = new Date(date)
  return d.toDateString() === today.toDateString()
}

export function isFutureDate(date: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d > today
}

export function getDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
