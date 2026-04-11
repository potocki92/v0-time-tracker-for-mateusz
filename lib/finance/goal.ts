import { Goal } from '@/app/(app)/dashboard/_domain/dashboard.types'
import { MonthlyTotals } from '@/lib/types'

export function calculateGoalProgress(
  goal: Goal | null,
  totals: MonthlyTotals
): number {
  if (!goal || !goal.amount || goal.amount <= 0) return 0

  const current =
    goal.currency === 'EUR'
      ? totals.earningsEUR
      : totals.totalEarningsAllPLN

  return Math.min(100, (current / goal.amount) * 100)
}