'use client'

import { useMemo, useState } from 'react'
import { calculateGoalProgress } from '@/lib/finance/goal'
import { useDashboardData } from '../../hooks'
import { useFilteredEntries } from '../../hooks/useFilteredEntries'
import { useDashboardTotals } from '../../hooks/useDashboardTotal'
import { useGoal } from '../../hooks/usePreferencesStore'
import { GoalCardBoundary } from '../errors'
import { MonthlyGoalCard } from './linear'
import { GoalEditDialog } from '../card/GoalEditDialog'
import { useDashboardRange } from './DashboardRangeContext'

function findReachedDate(
  entries: ReturnType<typeof useFilteredEntries>,
  clients: ReturnType<typeof useDashboardData>['data']['clients'],
  target: number,
): string | null {
  if (!target || entries.length === 0) return null
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  let cumulative = 0
  const clientMap = new Map(clients.map((c) => [c.id, c]))
  for (const e of sorted) {
    if (e.status !== 'worked') continue
    const c = e.client_id ? clientMap.get(e.client_id) : null
    if (!c) continue
    const hours = e.hours ?? 0
    cumulative += hours * (c.rate ?? 0)
    if (cumulative >= target) {
      const d = new Date(e.date)
      return d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })
    }
  }
  return null
}

function calcStreak(entries: ReturnType<typeof useFilteredEntries>): number {
  // Count consecutive days backward from today with worked entries.
  const worked = new Set(
    entries.filter((e) => e.status === 'worked' && (e.hours ?? 0) > 0).map((e) => e.date),
  )
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cursor = new Date(today)
  while (true) {
    const iso = cursor.toISOString().slice(0, 10)
    if (worked.has(iso)) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function GoalSection() {
  const { data } = useDashboardData()
  const { dateRange } = useDashboardRange()
  const goal = useGoal()
  const filtered = useFilteredEntries(data.workEntries, dateRange)
  const totals = useDashboardTotals(filtered, data.clients)
  const [editing, setEditing] = useState(false)

  const progress = useMemo(
    () => calculateGoalProgress(goal, totals),
    [goal, totals],
  )

  const reachedDate = useMemo(
    () => findReachedDate(filtered, data.clients, goal?.amount ?? 0),
    [filtered, data.clients, goal?.amount],
  )

  // Streak across last 60 days of all entries (not just filtered range)
  const streakDays = useMemo(
    () => calcStreak(data.workEntries),
    [data.workEntries],
  )

  const target = goal?.amount ?? 0
  const currency = goal?.currency ?? 'EUR'
  const current = currency === 'EUR' ? totals.earningsEUR : totals.totalEarningsAllPLN

  return (
    <>
      <GoalCardBoundary>
        <MonthlyGoalCard
          progress={progress}
          target={target}
          currency={currency}
          current={current}
          reachedDate={reachedDate}
          streakDays={streakDays}
          onEdit={() => setEditing(true)}
        />
      </GoalCardBoundary>

      <GoalEditDialog
        open={editing}
        onOpenChange={setEditing}
        initialGoal={goal}
      />
    </>
  )
}
