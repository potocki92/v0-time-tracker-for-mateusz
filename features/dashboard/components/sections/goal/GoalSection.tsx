'use client'

import { useMemo, useState } from 'react'
import {
  calculateGoalProgress,
  findGoalReachedDate,
  getCurrentEarningsForGoal,
} from '@/lib/finance/goal'
import { isRealizedEntry } from '@/lib/finance/realization'
import { formatCurrency, getTodayLocalDateString } from '@/lib/helpers'
import type { WorkEntry } from '@/lib/types'
import { useDashboardSlice } from '../../../hooks/useDashboardSlice'
import {
  selectClients,
  selectWorkEntries,
} from '../../../hooks/dashboardSelectors'
import { useEffectiveEurRate, useGoal } from '../../../hooks/usePreferencesStore'
import { GoalCardBoundary } from '../../errors'
import { GoalEditDialog } from '../../card/GoalEditDialog'
import { MonthlyGoalCard } from './MonthlyGoalCard'
import { useDashboardDerived } from '../shared/DashboardDerivedContext'

function calcStreak(entries: WorkEntry[], todayIso: string): number {
  // Count consecutive realized worked days backward from today.
  const worked = new Set(
    entries
      .filter(
        (e) => e.status === 'worked' && (e.hours ?? 0) > 0 && isRealizedEntry(e, todayIso),
      )
      .map((e) => e.date),
  )
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`
  const [y, m, d] = todayIso.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  let streak = 0
  while (worked.has(fmt(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function GoalSection() {
  // `clients` nadal potrzebne: findGoalReachedDate liczy skumulowany zarobek
  // po wpisach, wiec musi znac stawki. `workEntries` — bo seria idzie po
  // wszystkich wpisach, nie tylko po tych z zakresu.
  const clients = useDashboardSlice(selectClients)
  const workEntries = useDashboardSlice(selectWorkEntries)
  const goal = useGoal()
  const eurRate = useEffectiveEurRate()
  const { realized, totals, predictedTotals } = useDashboardDerived()
  const [editing, setEditing] = useState(false)

  const progress = useMemo(
    () => calculateGoalProgress(goal, totals),
    [goal, totals],
  )

  const reachedDate = useMemo(
    () => findGoalReachedDate(realized, clients, goal, eurRate),
    [realized, clients, goal, eurRate],
  )

  // Seria liczona po wszystkich zrealizowanych wpisach (nie tylko z zakresu).
  const streakDays = useMemo(
    () => calcStreak(workEntries, getTodayLocalDateString()),
    [workEntries],
  )

  const target = goal?.amount ?? 0
  const currency = goal?.currency ?? 'EUR'
  const current = getCurrentEarningsForGoal(goal, totals)
  const predictedCurrent = getCurrentEarningsForGoal(goal, predictedTotals)

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

      {predictedCurrent > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          W planie:{' '}
          <span className="font-medium text-foreground">
            {formatCurrency(predictedCurrent, currency)}
          </span>
        </p>
      )}

      <GoalEditDialog
        open={editing}
        onOpenChange={setEditing}
        initialGoal={goal}
      />
    </>
  )
}
