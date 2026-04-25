'use client'

import { useMemo } from 'react'
import { calculateEarnings } from '@/lib/finance/earnings'
import { useDashboardData } from '../../_hooks'
import { useEffectiveEurRate } from '../../_hooks/usePreferencesStore'
import { WeeklyGlanceCard, type WeeklyDay } from '../linear'

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function startOfWeek(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  const day = (c.getDay() + 6) % 7
  c.setDate(c.getDate() - day)
  return c
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function WeeklyGlanceSection() {
  const { data } = useDashboardData()
  const eurRate = useEffectiveEurRate()

  const computed = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = startOfWeek(today)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(weekStart.getDate() - 1)

    const clientMap = new Map(data.clients.map((c) => [c.id, c]))

    const dayBuckets = new Map<string, { hours: number; earnings: number }>()
    let lastWeekTotalHours = 0

    for (const e of data.workEntries) {
      if (e.status !== 'worked') continue
      const ed = new Date(e.date)
      ed.setHours(0, 0, 0, 0)
      const t = ed.getTime()
      const hours = e.hours ?? 0
      if (t >= weekStart.getTime() && t <= weekEnd.getTime()) {
        const c = e.client_id ? clientMap.get(e.client_id) : undefined
        const earnings = c ? calculateEarnings(e, c, eurRate).amountInPLN : 0
        const key = isoDate(ed)
        const cur = dayBuckets.get(key) ?? { hours: 0, earnings: 0 }
        cur.hours += hours
        cur.earnings += earnings
        dayBuckets.set(key, cur)
      } else if (t >= lastWeekStart.getTime() && t <= lastWeekEnd.getTime()) {
        lastWeekTotalHours += hours
      }
    }

    const days: WeeklyDay[] = WEEKDAY_SHORT.map((short, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const key = isoDate(d)
      const bucket = dayBuckets.get(key)
      const isToday = key === isoDate(today)
      const isFuture = d.getTime() > today.getTime()
      return {
        date: key,
        weekday: short,
        hours: bucket?.hours ?? 0,
        isToday,
        isFuture,
      }
    })

    const totalHours = days.reduce((s, d) => s + d.hours, 0)
    const earned = Array.from(dayBuckets.values()).reduce((s, b) => s + b.earnings, 0)
    const trendPercent =
      lastWeekTotalHours > 0
        ? ((totalHours - lastWeekTotalHours) / lastWeekTotalHours) * 100
        : null

    return { days, totalHours, earned, trendPercent }
  }, [data.workEntries, data.clients, eurRate])

  return (
    <WeeklyGlanceCard
      days={computed.days}
      totalHours={computed.totalHours}
      earned={computed.earned}
      earnedCurrency="EUR"
      trendPercent={computed.trendPercent}
    />
  )
}
