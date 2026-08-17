import { useMemo } from 'react'
import { MonthlyTotals } from '@/lib/types'
import { calculateGoalProgress } from '@/lib/finance/goal'
import { selectGoal, usePreferencesStore } from './usePreferencesStore'

export function useGoalProgress(
  totals: MonthlyTotals
): number {
  const goal = usePreferencesStore(selectGoal)

  return useMemo(
    () => calculateGoalProgress(goal, totals),
    [goal, totals]
  )
}