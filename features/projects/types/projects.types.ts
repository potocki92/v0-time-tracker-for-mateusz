import type { Client, Project, WorkEntry } from '@/lib/types'

export type ProjectStatus = Project['status']
export type ProjectPriority = Project['priority']
export type ProjectStatusFilter = ProjectStatus | 'all'

export type ProjectsData = {
  projects: Project[]
  clients: Client[]
  workEntries: WorkEntry[]
}

export type ProjectKpis = {
  total: number
  active: number
  completed: number
  planned: number
  onHold: number
  totalBudget: number
  totalBudgetCurrency: 'PLN' | 'EUR'
  activeShare: number
  completedShare: number
}

export type ProjectStatusBreakdown = {
  total: number
  rows: Array<{
    status: ProjectStatus
    label: string
    count: number
    share: number
    accent: string
  }>
}

export type ProjectBudgetRow = {
  projectId: string
  projectName: string
  projectColor: string
  clientId: string | null
  clientName: string
  budget: number
  spent: number
  utilization: number
  hours: number
}

export type ProjectBudgetUtilization = {
  totalBudget: number
  totalSpent: number
  utilization: number
  contractedCount: number
  rows: ProjectBudgetRow[]
}

export type FeaturedProject = {
  project: Project
  clientName: string
  progressPct: number
  hoursLogged: number
  hoursTarget: number | null
  budget: number
  budgetSpent: number
  budgetUtilization: number
  tasksDone: number
  tasksTotal: number
  isAtRisk: boolean
}

export type ProjectListRow = {
  project: Project
  clientName: string
  clientColor: string
  progressPct: number
  hoursLogged: number
  budget: number
  budgetUtilization: number
  dueDate: string | null
  isAtRisk: boolean
}

export type ProjectsFiltersState = {
  search: string
  status: ProjectStatusFilter
}
