import { ErrorBoundary, QueryErrorBoundary } from '@/components/common/errors'
import type { SectionBoundaryProps } from '@/components/common/errors'

/**
 * Convenience wrappers — gotowe granice dla każdej sekcji kalendarza.
 * Podobnie jak w module dashboardu: jedna "klasyczna" granica dla sekcji
 * synchronicznych + wariant z QueryErrorResetBoundary dla suspense-a.
 */

export function CalendarContentBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <QueryErrorBoundary sectionName="CalendarContent" onError={onError}>
      {children}
    </QueryErrorBoundary>
  )
}

export function CalendarGridErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="CalendarGrid" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function CalendarStatsErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="CalendarStats" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function CalendarListErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="CalendarList" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
