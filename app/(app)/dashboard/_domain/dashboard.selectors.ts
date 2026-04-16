import { calculateMonthlyTotals } from '@/lib/helpers'
import { DashboardData } from './dashboard.types'
import { MonthlyTotals, Invoice } from '@/lib/types'

export function selectTotals(
  data: DashboardData,
  eurRate: number
): MonthlyTotals {
  return calculateMonthlyTotals(
    data.workEntries,
    data.clients,
    eurRate
  )
}

export function selectUnpaidInvoices(
  data: DashboardData
): Invoice[] {
  return data.invoices.filter((inv) => !inv.is_paid)
}