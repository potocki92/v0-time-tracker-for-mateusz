'use client'

import { ErrorBoundary, QueryErrorBoundary } from '@/components/common/errors'
import type { SectionBoundaryProps } from '@/components/common/errors'


/**
 * Granice błędów sekcji — reużywamy mechanizmu z dashboardu (ErrorBoundary + Sentry),
 * ale nazwy sekcji są klientowe, żeby logi były łatwo filtrowalne.
 */

export function ClientsContentBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <QueryErrorBoundary sectionName="ClientsContent" onError={onError}>
      {children}
    </QueryErrorBoundary>
  )
}

export function ClientsTableBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="ClientsTable" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function ClientsStatsBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <ErrorBoundary sectionName="ClientsStats" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
