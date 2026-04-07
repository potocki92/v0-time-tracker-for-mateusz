import { Client, WorkEntry, MonthlyTotals, AdvancedStats, DAY_NAMES_FULL } from './types'

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

export function calculateEarnings(
  entry: WorkEntry,
  client: Client | undefined,
  eurToPln: number
): { amount: number; currency: 'PLN' | 'EUR'; amountInPLN: number } {
  if (!client || entry.status !== 'worked') {
    return { amount: 0, currency: 'PLN', amountInPLN: 0 }
  }

  let amount = 0
  
  if (client.work_type === 'hourly') {
    amount = (entry.hours || 0) * client.rate
  } else {
    // Piecework
    const quantity = entry.quantity_from !== null && entry.quantity_to !== null
      ? entry.quantity_to - entry.quantity_from
      : entry.quantity || 0
    amount = quantity * client.rate
  }

  const amountInPLN = client.currency === 'EUR' ? amount * eurToPln : amount

  return { amount, currency: client.currency, amountInPLN }
}

export function calculateMonthlyTotals(
  entries: WorkEntry[],
  clients: Client[],
  eurToPln: number
): MonthlyTotals {
  const clientMap = new Map(clients.map(c => [c.id, c]))
  
  let totalHours = 0
  let totalDays = 0
  let earningsPLN = 0
  let earningsEUR = 0
  let vacationDays = 0
  let sickDays = 0
  let daysOff = 0

  for (const entry of entries) {
    switch (entry.status) {
      case 'worked':
        totalDays++
        totalHours += entry.hours || 0
        const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
        const earnings = calculateEarnings(entry, client, eurToPln)
        if (earnings.currency === 'PLN') {
          earningsPLN += earnings.amount
        } else {
          earningsEUR += earnings.amount
        }
        break
      case 'vacation':
        vacationDays++
        break
      case 'sick_leave':
        sickDays++
        break
      case 'day_off':
        daysOff++
        break
    }
  }

  const totalEarningsAllPLN = earningsPLN + earningsEUR * eurToPln

  return {
    totalHours,
    totalDays,
    earningsPLN,
    earningsEUR,
    totalEarningsAllPLN,
    vacationDays,
    sickDays,
    daysOff
  }
}

export function calculateAdvancedStats(
  entries: WorkEntry[],
  clients: Client[],
  eurToPln: number,
  prevMonthEntries: WorkEntry[]
): AdvancedStats {
  const totals = calculateMonthlyTotals(entries, clients, eurToPln)
  const prevTotals = calculateMonthlyTotals(prevMonthEntries, clients, eurToPln)

  // Average hourly rate
  const avgHourlyRate = totals.totalHours > 0 
    ? totals.totalEarningsAllPLN / totals.totalHours 
    : 0

  // Most productive day of week
  const dayStats: Record<number, number> = {}
  for (const entry of entries) {
    if (entry.status === 'worked') {
      const dayOfWeek = new Date(entry.date).getDay()
      dayStats[dayOfWeek] = (dayStats[dayOfWeek] || 0) + (entry.hours || 0)
    }
  }
  const mostProductiveDayNum = Object.entries(dayStats)
    .sort(([, a], [, b]) => b - a)[0]?.[0]
  const mostProductiveDay = mostProductiveDayNum 
    ? DAY_NAMES_FULL[parseInt(mostProductiveDayNum)] 
    : '-'

  // Comparison with last month
  const comparisonWithLastMonth = prevTotals.totalEarningsAllPLN > 0
    ? ((totals.totalEarningsAllPLN - prevTotals.totalEarningsAllPLN) / prevTotals.totalEarningsAllPLN) * 100
    : 0

  // Work streak
  let workStreak = 0
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  for (const entry of sortedEntries) {
    if (entry.status === 'worked') {
      workStreak++
    } else {
      break
    }
  }

  return {
    avgHourlyRate,
    mostProductiveDay,
    comparisonWithLastMonth,
    workStreak,
    totalHoursMonth: totals.totalHours,
    totalDaysMonth: totals.totalDays
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
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
