import type { SupabaseClient } from '@supabase/supabase-js'

type MonthlyEarningsSummary = {
  workedDays: number
  totalHours: number
  realizedEarningsPln: number
  predictedEarningsPln: number
  totalEarningsPln: number
}

/**
 * Wersja frontendowa bez SQL FILTER (agregacja po stronie TS).
 * Działa, ale dla większych datasetów lepsze będzie RPC:
 * - pobiera wszystkie wpisy z miesiąca do klienta,
 * - agreguje w JS,
 * - nie używa indeksów DB do końcowej agregacji.
 */
export async function getMonthlyWorkEarningsViaSdk(
  supabase: SupabaseClient,
  userId: string,
  monthStartIso: string, // np. "2026-05-01"
  monthEndIso: string, // np. "2026-06-01"
  eurToPln: number,
): Promise<MonthlyEarningsSummary> {
  const { data, error } = await supabase
    .from('work_entries')
    .select('date,status,hours,quantity,billing_rate,billing_currency,billing_work_type')
    .eq('user_id', userId)
    .gte('date', monthStartIso)
    .lt('date', monthEndIso)

  if (error) throw error

  const todayIso = new Date().toISOString().slice(0, 10)
  const rows = data ?? []

  let workedDays = 0
  let totalHours = 0
  let realizedEarningsPln = 0
  let predictedEarningsPln = 0

  for (const row of rows) {
    if (row.status !== 'worked') continue
    workedDays += 1
    totalHours += row.hours ?? 0

    const rate = row.billing_rate ?? 0
    const nativeAmount =
      row.billing_work_type === 'piecework'
        ? rate * (row.quantity ?? 0)
        : rate * (row.hours ?? 0)
    const amountPln =
      row.billing_currency === 'EUR' ? nativeAmount * eurToPln : nativeAmount

    if (row.date > todayIso) predictedEarningsPln += amountPln
    else realizedEarningsPln += amountPln
  }

  return {
    workedDays,
    totalHours,
    realizedEarningsPln,
    predictedEarningsPln,
    totalEarningsPln: realizedEarningsPln + predictedEarningsPln,
  }
}

/**
 * Wersja rekomendowana: agregacja po stronie bazy (RPC).
 * Najlepsza dla wydajności i spójności logiki.
 */
export async function getMonthlyWorkEarningsViaRpc(
  supabase: SupabaseClient,
  userId: string,
  monthStartIso: string,
  monthEndIso: string,
) {
  const { data, error } = await supabase.rpc('get_monthly_work_earnings', {
    p_user_id: userId,
    p_month_start: monthStartIso,
    p_month_end: monthEndIso,
  })

  if (error) throw error
  return data
}

