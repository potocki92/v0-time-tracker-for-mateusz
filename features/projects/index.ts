/**
 * Public API of the Projects feature module.
 *
 * Micro-SaaS boundary: only the symbols below may be imported by the
 * rest of the app. Internal modules (selectors, fetchers, linear cards)
 * stay private to keep the contract stable.
 *
 * Server-only entry point lives in '@/features/projects/server'.
 */
export { ProjectsContent } from './components/ProjectsContent'
export { ProjectsSkeleton } from './components/ProjectsSkeleton'
export {
  ProjectsContentBoundary,
  ProjectsListBoundary,
  ProjectsStatsBoundary,
} from './components/errors'
export {
  useProjectsData,
  useProjectsKpis,
  useStatusBreakdown,
  useBudgetUtilization,
  useFeaturedProject,
  useProjectsFilters,
  useProjectForm,
  useProjectMutations,
  useClientProjectAggregate,
  useClientProjectAggregates,
} from './hooks'
export type {
  ProjectsData,
  ProjectKpis,
  ProjectStatusBreakdown,
  ProjectBudgetUtilization,
  ProjectListRow,
  FeaturedProject,
  ClientProjectAggregate,
} from './types/projects.types'
export {
  selectClientProjectAggregate,
  selectClientProjectAggregates,
} from './types/projects.selectors'
