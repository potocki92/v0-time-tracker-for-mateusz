export function getWeekStart(date: Date): Date {
  const clone = new Date(date)
  const day = clone.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  clone.setDate(clone.getDate() + mondayOffset)
  clone.setHours(0, 0, 0, 0)
  return clone
}

export function getWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return `${weekStart.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}–${weekEnd.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}`
}