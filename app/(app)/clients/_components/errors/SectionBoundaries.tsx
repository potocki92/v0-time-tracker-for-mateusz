'use client'

import { ErrorBoundary } from '@/app/(app)/dashboard/_components/errors/ErrorBoundary'
import { QueryErrorBoundary } from '@/app/(app)/dashboard/_components/errors/QueryErrorBoundary'
import type { SectionBoundaryProps } from '@/app/(app)/dashboard/_components/errors/ErrorBoundary.types'

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
