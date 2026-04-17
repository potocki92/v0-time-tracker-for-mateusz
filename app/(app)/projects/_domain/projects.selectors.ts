import type { Client, Project, WorkEntry } from '@/lib/types'
import type { ProjectProgress, ProjectStats, ProjectsData } from './projects.types'

export function selectProjectStats(projects: Project[]): ProjectStats {
  return projects.reduce<ProjectStats>(
    (stats, project) => {
      stats.total += 1
      stats.totalBudget += Number(project.budget_amount ?? 0)

      if (project.status === 'in_progress') stats.active += 1
      else if (project.status === 'completed') stats.completed += 1
      else if (project.status === 'planned') stats.planned += 1
      else if (project.status === 'on_hold') stats.onHold += 1

      return stats
    },
    { total: 0, active: 0, completed: 0, planned: 0, onHold: 0, totalBudget: 0 },
  )
}

export function selectProjectProgress(
  project: Project,
  workEntries: WorkEntry[],
): ProjectProgress {
  const target = Number(project.target_quantity ?? 0)

  if (!target || target <= 0) {
    return { percent: 0, quantityDone: 0, target: 0 }
  }

  const quantityDone = workEntries
    .filter((entry) => entry.project_id === project.id)
    .reduce((sum, entry) => sum + Number(entry.quantity ?? 0), 0)

  return {
    percent: Math.min(100, (quantityDone / target) * 100),
    quantityDone,
    target,
  }
}

export function selectProgressByProject(
  projects: Project[],
  workEntries: WorkEntry[],
): Map<string, ProjectProgress> {
  const map = new Map<string, ProjectProgress>()
  projects.forEach((project) => {
    map.set(project.id, selectProjectProgress(project, workEntries))
  })
  return map
}

export function selectClientNameById(clients: Client[]): Map<string, string> {
  return new Map(clients.map((client) => [client.id, client.name]))
}

export function selectClientName(
  clientId: string | null,
  clients: Client[],
): string {
  if (!clientId) return 'Bez klienta'
  return clients.find((client) => client.id === clientId)?.name ?? 'Nieznany klient'
}

export function selectFilteredProjects(
  data: ProjectsData,
  filters: { search: string; status: 'all' | Project['status'] },
): Project[] {
  const { projects, clients } = data
  const query = filters.search.trim().toLowerCase()
  const nameById = selectClientNameById(clients)

  return projects.filter((project) => {
    if (filters.status !== 'all' && project.status !== filters.status) return false
    if (!query) return true

    const clientName = project.client_id ? nameById.get(project.client_id) ?? '' : ''
    return (
      project.name.toLowerCase().includes(query) ||
      clientName.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query)
    )
  })
}
