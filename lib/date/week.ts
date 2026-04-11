export function getWeekStart(date: Date): Date {
  const clone = new Date(date)
  const day = clone.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  clone.setDate(clone.getDate() + mondayOffset)
  clone.setHours(0, 0, 0, 0)
  return clone
}