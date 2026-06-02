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

/** Poniedziałek–niedziela obejmujący podaną datę. */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Numer tygodnia wg ISO-8601 (1..53), tydzień zaczyna się w poniedziałek,
 * a tydzień 1 to ten, który zawiera pierwszy czwartek roku.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

/** Rok ISO przypisany do tygodnia (różni się od kalendarzowego na przełomie roku). */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}