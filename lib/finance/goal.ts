import { Goal } from '@/app/(app)/dashboard/_domain/dashboard.types'
import { MonthlyTotals } from '@/lib/types'

/**
 * Strict, currency-isolated goal progress.
 *
 * Cele i przychody trzymamy w odseparowanych kontenerach walutowych:
 *  - cel w EUR liczymy WYŁĄCZNIE z `earningsEUR`
 *  - cel w PLN liczymy WYŁĄCZNIE z `earningsPLN`
 *
 * Brak ukrytych konwersji – 5000 EUR ≠ 5000 PLN.
 * Konwersję do widoków zbiorczych robimy świadomie w innym miejscu
 * (np. `totals.totalEarningsAllPLN`), nie tutaj.
 */
export function calculateGoalProgress(
  goal: Goal | null,
  totals: MonthlyTotals,
): number {
  if (!goal?.amount || goal.amount <= 0) return 0

  const current = getCurrentEarningsForGoal(goal, totals)
  const ratio = (current / goal.amount) * 100

  return Math.min(100, Math.max(0, ratio))
}

/** Aktualne zarobki w walucie celu — do wyświetlenia obok progressu. */
export function getCurrentEarningsForGoal(
  goal: Goal | null,
  totals: MonthlyTotals,
): number {
  if (!goal) return 0
  return goal.currency === 'EUR' ? totals.earningsEUR : totals.earningsPLN
}
