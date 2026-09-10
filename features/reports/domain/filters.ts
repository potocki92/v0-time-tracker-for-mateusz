import { ALL, type ReportProjectRef } from './types'

/**
 * Projekt, ktory ma zostac w filtrach po zmianie klienta.
 *
 * Bez tego w adresie zostawalby `project` nalezacy do INNEGO klienta, a raport
 * pokazywalby pustke bez zadnego widocznego powodu — filtr projektu wygladalby
 * poprawnie, bo select i tak nie mial takiej opcji na liscie.
 */
export function projectAfterClientChange(
  projects: ReportProjectRef[],
  clientId: string,
  currentProjectId: string,
): string {
  if (currentProjectId === ALL || clientId === ALL) return currentProjectId
  const belongsToClient = projects.some(
    (project) => project.id === currentProjectId && project.client_id === clientId,
  )
  return belongsToClient ? currentProjectId : ALL
}

/** Projekty widoczne przy wybranym kliencie. */
export function projectsForClient(
  projects: ReportProjectRef[],
  clientId: string,
): ReportProjectRef[] {
  return clientId === ALL ? projects : projects.filter((project) => project.client_id === clientId)
}
