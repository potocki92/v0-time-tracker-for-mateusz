import { Client, Invoice, Project, WorkEntry } from "@/lib/types"

export type TimeRange =
  | 'current_week'
  | 'previous_week'
  | 'current_month'
  | 'previous_month'
  | 'current_quarter'
  | 'current_year'
  | 'all'

export type ChartGrouping = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export type DashboardData = {
  userName: string
  clients: Client[]
  workEntries: WorkEntry[]
  invoices: Invoice[]
  projects: Project[]
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

export type Currency = 'PLN' | 'EUR'
export type Goal = {
  amount: number | null
  currency: Currency
}
