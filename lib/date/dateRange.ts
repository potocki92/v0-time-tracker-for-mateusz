import { TimeRange } from "@/app/(app)/dashboard/_domain/dashboard.types"

export function getDateRange(range: TimeRange) {
  const now = new Date()

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

  switch (range) {
    case 'current_week': {
      const day = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - day + 1)

      return {
        from: startOfDay(monday),
        to: endOfDay(now),
      }
    }

    case 'previous_week': {
      const day = now.getDay() || 7
      const lastMonday = new Date(now)
      lastMonday.setDate(now.getDate() - day - 6)

      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)

      return {
        from: startOfDay(lastMonday),
        to: endOfDay(lastSunday),
      }
    }

    case 'current_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      }

    case 'previous_month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      }

    case 'current_quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      const startMonth = quarter * 3

      return {
        from: new Date(now.getFullYear(), startMonth, 1),
        to: endOfDay(now),
      }
    }

    case 'current_year':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: endOfDay(now),
      }

    case 'all':
    default:
      return { from: null, to: null }
  }
}