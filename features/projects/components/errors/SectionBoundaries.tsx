import { ErrorBoundary, QueryErrorBoundary } from '@/components/common/errors'
import type { SectionBoundaryProps } from '@/components/common/errors'

/**
 * Convenience wrappers — gotowe granice dla każdej sekcji modułu projektów.
 */

export function ProjectsContentBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <QueryErrorBoundary sectionName="ProjectsContent" onError={onError}>
      {children}
    </QueryErrorBoundary>
  )
}

export function ProjectsStatsBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="ProjectStats" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function ProjectsListBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="ProjectsList" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
