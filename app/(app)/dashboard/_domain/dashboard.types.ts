import { Client, Invoice, WorkEntry } from "@/lib/types"

export type TimeRange =
  | 'current_week'
  | 'previous_week'
  | 'current_month'
  | 'previous_month'
  | 'current_quarter'
  | 'current_year'
  | 'all'

export type ChartGrouping = 'daily' | 'weekly' | 'monthly'

export type DashboardData = {
  userName: string
  eurToPlnRate: number
  clients: Client[]
  workEntries: WorkEntry[]
  invoices: Invoice[]
}

export type UseDashboardDataReturn = {
  loading: boolean
  data: DashboardData
}

export type ChartDataItem = {
  label: string
  earningsPLN: number
  hours: number
}

export type Goal = {
  amount: number | null
  currency: 'PLN' | 'EUR'
}