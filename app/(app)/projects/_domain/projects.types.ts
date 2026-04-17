import type { Client, Project, WorkEntry } from '@/lib/types'

export type ProjectStatus = Project['status']
export type ProjectPriority = Project['priority']
export type ProjectBudgetType = Project['budget_type']

export type ProjectStatusFilter = ProjectStatus | 'all'

export type ProjectsData = {
  projects: Project[]
  clients: Client[]
  workEntries: WorkEntry[]
}

export type ProjectStats = {
  total: number
  active: number
  completed: number
  planned: number
  onHold: number
  totalBudget: number
}

export type ProjectProgress = {
  percent: number
  quantityDone: number
  target: number
}

export type ProjectFilters = {
  search: string
  status: ProjectStatusFilter
}

export type ProjectsSortKey = 'name' | 'client' | 'status' | 'priority' | 'budget' | 'end_date' | 'start_date'
export type ProjectsSortDirection = 'asc' | 'desc'
