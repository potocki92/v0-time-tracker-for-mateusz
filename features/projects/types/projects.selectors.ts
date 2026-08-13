import { clientNameToColor } from '@/components/common/ClientDisplay'
import { PROJECT_STATUS_LABELS, type Client, type Project, type WorkEntry } from '@/lib/types'
import {
  FEATURED_DEFAULT_TARGET_HOURS,
  PROJECT_STATUS_ACCENT,
} from './projects.constants'
import type {
  ClientProjectAggregate,
  FeaturedProject,
  ProjectBudgetRow,
  ProjectBudgetUtilization,
  ProjectKpis,
  ProjectListRow,
  ProjectStatus,
  ProjectStatusBreakdown,
  ProjectsData,
  ProjectsFiltersState,
} from './projects.types'

const NO_CLIENT_LABEL = 'Bez klienta'
const UNKNOWN_CLIENT_LABEL = 'Nieznany klient'

const STATUS_ORDER: Record<ProjectStatus, number> = {
  in_progress: 0,
  planned: 1,
  on_hold: 2,
  completed: 3,
}

function buildClientIndex(clients: Client[]): Map<string, Client> {
  return new Map(clients.map((c) => [c.id, c]))
}

function clientNameOf(clientId: string | null, byId: Map<string, Client>): string {
  if (!clientId) return NO_CLIENT_LABEL
  return byId.get(clientId)?.name ?? UNKNOWN_CLIENT_LABEL
}

function safeNumber(value: number | null | undefined): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function projectHours(projectId: string, workEntries: WorkEntry[]): number {
  let total = 0
  for (const entry of workEntries) {
    if (entry.project_id !== projectId) continue
    if (entry.status !== 'worked') continue
    total += safeNumber(entry.hours)
  }
  return total
}

/**
 * Money "spent" on a project = sum of (hours * effective rate) across
 * worked entries that point to this project. Falls back to the client's
 * default rate when an entry doesn't carry an override. Pure function —
 * no DB calls, no side effects, ready for the clients module to reuse.
 */
function projectSpent(
  project: Project,
  workEntries: WorkEntry[],
  client: Client | undefined,
): number {
  let total = 0
  for (const entry of workEntries) {
    if (entry.project_id !== project.id) continue
    if (entry.status !== 'worked') continue
    const rate = safeNumber(entry.billing_rate ?? client?.rate)
    const workType = entry.billing_work_type ?? client?.work_type ?? 'hourly'
    if (workType === 'piecework') {
      total += rate * safeNumber(entry.quantity)
    } else {
      total += rate * safeNumber(entry.hours)
    }
  }
  return total
}

function progressPercent(
  project: Project,
  workEntries: WorkEntry[],
): number {
  if (project.status === 'completed') return 100
  const target = safeNumber(project.target_quantity)
  if (target > 0) {
    const done = workEntries
      .filter((e) => e.project_id === project.id)
      .reduce((sum, e) => sum + safeNumber(e.quantity), 0)
    return Math.max(0, Math.min(100, Math.round((done / target) * 100)))
  }
  // Fallback: budget burn
  return 0
}

function isProjectAtRisk(project: Project, budgetUtilization: number): boolean {
  if (project.status !== 'in_progress') return false
  if (budgetUtilization >= 1) return true
  if (!project.end_date) return false
  const end = new Date(project.end_date).getTime()
  if (Number.isNaN(end)) return false
  const daysLeft = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24))
  return daysLeft <= 7
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export function selectProjectKpis(projects: Project[]): ProjectKpis {
  const kpis: ProjectKpis = {
    total: 0,
    active: 0,
    completed: 0,
    planned: 0,
    onHold: 0,
    totalBudget: 0,
    totalBudgetCurrency: 'PLN',
    activeShare: 0,
    completedShare: 0,
  }

  for (const p of projects) {
    kpis.total += 1
    kpis.totalBudget += safeNumber(p.budget_amount)
    if (p.status === 'in_progress') kpis.active += 1
    else if (p.status === 'completed') kpis.completed += 1
    else if (p.status === 'planned') kpis.planned += 1
    else if (p.status === 'on_hold') kpis.onHold += 1
  }

  if (kpis.total > 0) {
    kpis.activeShare = Math.round((kpis.active / kpis.total) * 100)
    kpis.completedShare = Math.round((kpis.completed / kpis.total) * 100)
  }

  return kpis
}

// ── Status breakdown ─────────────────────────────────────────────────────────

export function selectStatusBreakdown(projects: Project[]): ProjectStatusBreakdown {
  const counts: Record<ProjectStatus, number> = {
    in_progress: 0,
    completed: 0,
    planned: 0,
    on_hold: 0,
  }

  for (const p of projects) counts[p.status] += 1

  const total = projects.length
  const order: ProjectStatus[] = ['in_progress', 'completed', 'planned', 'on_hold']

  return {
    total,
    rows: order.map((status) => ({
      status,
      label: PROJECT_STATUS_LABELS[status],
      count: counts[status],
      share: total > 0 ? Math.round((counts[status] / total) * 100) : 0,
      accent: PROJECT_STATUS_ACCENT[status],
    })),
  }
}

// ── Budget utilisation ───────────────────────────────────────────────────────

export function selectBudgetUtilization(data: ProjectsData): ProjectBudgetUtilization {
  const byId = buildClientIndex(data.clients)
  const rows: ProjectBudgetRow[] = []
  let totalBudget = 0
  let totalSpent = 0
  let contractedCount = 0

  for (const project of data.projects) {
    const budget = safeNumber(project.budget_amount)
    if (budget <= 0) continue

    const client = project.client_id ? byId.get(project.client_id) : undefined
    const spent = projectSpent(project, data.workEntries, client)
    const hours = projectHours(project.id, data.workEntries)

    totalBudget += budget
    totalSpent += spent
    contractedCount += 1

    rows.push({
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
      clientId: project.client_id,
      clientName: clientNameOf(project.client_id, byId),
      budget,
      spent,
      utilization: budget > 0 ? spent / budget : 0,
      hours,
    })
  }

  rows.sort((a, b) => b.spent - a.spent)

  return {
    totalBudget,
    totalSpent,
    utilization: totalBudget > 0 ? totalSpent / totalBudget : 0,
    contractedCount,
    rows,
  }
}

// ── Featured project ─────────────────────────────────────────────────────────

/**
 * Featured = active project with highest priority and closest deadline.
 * Falls back to most-recently-created in_progress, then any project.
 */
export function selectFeaturedProject(data: ProjectsData): FeaturedProject | null {
  if (data.projects.length === 0) return null

  const PRIORITY_RANK: Record<Project['priority'], number> = { high: 0, medium: 1, low: 2 }
  const byId = buildClientIndex(data.clients)

  const active = data.projects.filter((p) => p.status === 'in_progress')
  const pool = active.length > 0 ? active : data.projects

  const sorted = [...pool].sort((a, b) => {
    const prio = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (prio !== 0) return prio
    const aEnd = a.end_date ? new Date(a.end_date).getTime() : Number.POSITIVE_INFINITY
    const bEnd = b.end_date ? new Date(b.end_date).getTime() : Number.POSITIVE_INFINITY
    return aEnd - bEnd
  })

  const project = sorted[0]
  if (!project) return null

  const client = project.client_id ? byId.get(project.client_id) : undefined
  const hoursLogged = projectHours(project.id, data.workEntries)
  const budget = safeNumber(project.budget_amount)
  const budgetSpent = projectSpent(project, data.workEntries, client)
  const budgetUtilization = budget > 0 ? budgetSpent / budget : 0
  const progressPct = progressPercent(project, data.workEntries)

  // Approximate task counts from quantity-based projects.
  const tasksTotal = safeNumber(project.target_quantity)
  const tasksDone = data.workEntries
    .filter((e) => e.project_id === project.id)
    .reduce((sum, e) => sum + safeNumber(e.quantity), 0)

  return {
    project,
    clientName: clientNameOf(project.client_id, byId),
    progressPct: progressPct || Math.round(budgetUtilization * 100),
    hoursLogged,
    hoursTarget: tasksTotal > 0 ? null : FEATURED_DEFAULT_TARGET_HOURS,
    budget,
    budgetSpent,
    budgetUtilization,
    tasksDone: Math.round(tasksDone),
    tasksTotal: Math.round(tasksTotal),
    isAtRisk: isProjectAtRisk(project, budgetUtilization),
  }
}

// ── Project list rows ────────────────────────────────────────────────────────

export function selectProjectListRows(data: ProjectsData): ProjectListRow[] {
  const byId = buildClientIndex(data.clients)

  return [...data.projects]
    .sort((a, b) => {
      const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (s !== 0) return s
      return a.name.localeCompare(b.name)
    })
    .map((project) => {
      const client = project.client_id ? byId.get(project.client_id) : undefined
      const budget = safeNumber(project.budget_amount)
      const spent = projectSpent(project, data.workEntries, client)
      const utilization = budget > 0 ? spent / budget : 0
      const clientName = clientNameOf(project.client_id, byId)
      return {
        project,
        clientName,
        // Deterministyczny kolor z nazwy zamiast jednego niebieskiego dla
        // wszystkich klientów bez ustawionego `color`.
        clientColor: client?.color ?? clientNameToColor(clientName),
        progressPct: progressPercent(project, data.workEntries) || Math.round(utilization * 100),
        hoursLogged: projectHours(project.id, data.workEntries),
        budget,
        budgetUtilization: utilization,
        dueDate: project.end_date,
        isAtRisk: isProjectAtRisk(project, utilization),
      }
    })
}

export function selectFilteredRows(
  rows: ProjectListRow[],
  filters: ProjectsFiltersState,
): ProjectListRow[] {
  const query = filters.search.trim().toLowerCase()

  return rows.filter((row) => {
    if (filters.status !== 'all' && row.project.status !== filters.status) return false
    if (!query) return true
    return (
      row.project.name.toLowerCase().includes(query) ||
      row.clientName.toLowerCase().includes(query) ||
      (row.project.description ?? '').toLowerCase().includes(query)
    )
  })
}

// ── Per-client aggregation (clients module integration point) ────────────────

export function selectClientProjectAggregates(data: ProjectsData): ClientProjectAggregate[] {
  const byId = buildClientIndex(data.clients)
  const rowsByClient = new Map<string, ProjectListRow[]>()
  const allRows = selectProjectListRows(data)

  for (const row of allRows) {
    const key = row.project.client_id ?? '__none__'
    const bucket = rowsByClient.get(key)
    if (bucket) bucket.push(row)
    else rowsByClient.set(key, [row])
  }

  const aggregates: ClientProjectAggregate[] = []
  for (const [clientId, rows] of rowsByClient) {
    const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0)
    const totalSpent = rows.reduce((sum, r) => sum + r.budget * r.budgetUtilization, 0)
    const hoursLogged = rows.reduce((sum, r) => sum + r.hoursLogged, 0)
    const totalProjects = rows.length
    const activeProjects = rows.filter((r) => r.project.status === 'in_progress').length
    const completedProjects = rows.filter((r) => r.project.status === 'completed').length
    const averageProgress = totalProjects
      ? Math.round(rows.reduce((sum, r) => sum + r.progressPct, 0) / totalProjects)
      : 0
    const utilization = totalBudget > 0 ? totalSpent / totalBudget : 0

    aggregates.push({
      clientId,
      clientName:
        clientId === '__none__' ? NO_CLIENT_LABEL : byId.get(clientId)?.name ?? UNKNOWN_CLIENT_LABEL,
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalSpent,
      budgetUtilization: utilization,
      hoursLogged,
      averageProgress,
      isOverBudget: utilization > 1,
    })
  }

  aggregates.sort((a, b) => b.totalBudget - a.totalBudget)
  return aggregates
}

export function selectClientProjectAggregate(
  data: ProjectsData,
  clientId: string,
): ClientProjectAggregate | null {
  return (
    selectClientProjectAggregates(data).find((agg) => agg.clientId === clientId) ?? null
  )
}
