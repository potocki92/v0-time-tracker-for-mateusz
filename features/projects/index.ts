/**
 * Public API of the Projects feature module.
 *
 * Micro-SaaS boundary: only the symbols below may be imported by the
 * rest of the app. Internal modules (hooks, selectors, fetchers, linear
 * cards) stay private to keep the contract stable.
 *
 * Server-only entry point lives in '@/features/projects/server'.
 */
export { ProjectsContent } from './components/ProjectsContent'
export { ProjectsSkeleton } from './components/ProjectsSkeleton'
export { ProjectsContentBoundary } from './components/errors'
