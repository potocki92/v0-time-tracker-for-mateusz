import { calculateMonthlyTotals } from '@/lib/helpers'
import { DashboardData } from './dashboard.types'
import { MonthlyTotals, Invoice } from '@/lib/types'

export function selectTotals(
  data: DashboardData
): MonthlyTotals {
  return calculateMonthlyTotals(
    data.workEntries,
    data.clients,
  )
}

export function selectUnpaidInvoices(
  data: DashboardData
): Invoice[] {
  return data.invoices.filter((inv) => !inv.is_paid)
}