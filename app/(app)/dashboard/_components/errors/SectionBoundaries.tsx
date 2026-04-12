import { ErrorBoundary } from './ErrorBoundary'
import type { SectionBoundaryProps } from './ErrorBoundary.types'

/**
 * Convenience wrappers — gotowe granice dla każdej sekcji dashboardu.
 * Używaj zamiast <ErrorBoundary sectionName="..."> dla czytelności.
 */

export function ChartErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="EarningsChart" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function InvoicesErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="InvoicesList" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function StatsErrorBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="StatsCards" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function EarningsCardBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="EarningsCard" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function GoalCardBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="GoalCard" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}