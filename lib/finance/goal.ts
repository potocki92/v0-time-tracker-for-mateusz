import { formatDate } from '@/lib/format'
import type { Goal } from '@/features/dashboard/domain'
import { Client, MonthlyTotals, WorkEntry } from '@/lib/types'
import { calculateEarnings } from './earnings'

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

/**
 * Data osiągnięcia celu — pierwszy dzień, w którym skumulowany zarobek
 * w walucie celu przekroczył próg. Zarobek liczymy przez `calculateEarnings`
 * (uwzględnia snapshot stawki, akord i walutę), a sumujemy wyłącznie kwoty
 * w walucie celu — spójnie z `getCurrentEarningsForGoal` (izolacja walut).
 */
export function findGoalReachedDate(
  entries: WorkEntry[],
  clients: Client[],
  goal: Goal | null,
  eurRate: number,
): string | null {
  const target = goal?.amount ?? 0
  if (!goal || target <= 0 || entries.length === 0) return null

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  let cumulative = 0
  for (const entry of sorted) {
    if (entry.status !== 'worked') continue
    const client = entry.client_id ? clientMap.get(entry.client_id) : undefined
    const earned = calculateEarnings(entry, client, eurRate)
    if (earned.currency !== goal.currency) continue
    cumulative += earned.amount
    if (cumulative >= target) {
      return formatDate(entry.date, 'dayMonth')
    }
  }
  return null
}
