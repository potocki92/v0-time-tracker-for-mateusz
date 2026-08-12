import type { SparklinePoint } from '../../../hooks/useEarningsSparkline'

/**
 * Budowa serii dla wykresu karty zarobków. Wydzielone z `EarningsCard`,
 * żeby typ `SeriesPoint` był współdzielony z lazy-ładowanym `EarningsSparkChart`
 * bez ciągnięcia recharts do głównego chunku.
 */

export type SeriesPoint = {
  date: string
  /** dzień miesiąca jako liczba (1..31) – używany na osi X dla normalizacji */
  day: number
  label: string
  cumulative: number
  forecast: number | null
  /** Skumulowana wartość z poprzedniego okresu zmapowana na ten sam dzień */
  prevCumulative: number | null
}

function cumulate(points: SparklinePoint[]): { day: number; value: number }[] {
  if (points.length === 0) return []
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  let acc = 0
  return sorted.map((p) => {
    acc += p.value
    return {
      day: new Date(p.date).getDate(),
      value: Math.round(acc * 100) / 100,
    }
  })
}

export function buildSeries(
  current: SparklinePoint[],
  previous: SparklinePoint[] | undefined,
): SeriesPoint[] {
  if (current.length === 0) return []

  const sorted = [...current].sort((a, b) => a.date.localeCompare(b.date))
  const prevCumulated = previous ? cumulate(previous) : []
  const prevByDay = new Map(prevCumulated.map((p) => [p.day, p.value]))

  let acc = 0
  const series: SeriesPoint[] = sorted.map((p) => {
    acc += p.value
    const d = new Date(p.date)
    const day = d.getDate()
    return {
      date: p.date,
      day,
      label: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
      cumulative: Math.round(acc * 100) / 100,
      forecast: null,
      prevCumulative: prevByDay.get(day) ?? null,
    }
  })

  // Prognoza linearna do końca miesiąca (zachowanie zgodne z poprzednią wersją).
  const last = series[series.length - 1]
  const lastDate = new Date(last.date)
  const dayOfMonth = lastDate.getDate()
  const daysInMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate()

  if (dayOfMonth < daysInMonth) {
    const dailyAvg = last.cumulative / Math.max(1, dayOfMonth)
    const cursor = new Date(lastDate)
    for (let i = 1; i <= daysInMonth - dayOfMonth; i += 1) {
      cursor.setDate(lastDate.getDate() + i)
      const projected = Math.round(dailyAvg * (dayOfMonth + i) * 100) / 100
      const day = cursor.getDate()
      series.push({
        date: cursor.toISOString().slice(0, 10),
        day,
        label: cursor.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
        cumulative: Number.NaN as unknown as number,
        forecast: projected,
        prevCumulative: prevByDay.get(day) ?? null,
      })
    }
  }

  return series
}
