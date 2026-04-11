import { useMemo } from 'react'
import { Goal } from '../_domain/dashboard.types'
import { MonthlyTotals } from '@/lib/types'
import { calculateGoalProgress } from '@/lib/finance/goal'

export function useGoalProgress(
  goal: Goal | null,
  totals: MonthlyTotals
): number {
  return useMemo(
    () => calculateGoalProgress(goal, totals),
    [goal, totals]
  )
}