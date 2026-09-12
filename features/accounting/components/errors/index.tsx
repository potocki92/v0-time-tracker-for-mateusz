import { QueryErrorBoundary } from '@/components/common/errors'
import type { SectionBoundaryProps } from '@/components/common/errors'
import { StatementErrorFallback } from './StatementErrorFallback'

/**
 * Granica bledu wykazu. Jeden wariant wystarczy: wykaz to jedno zapytanie,
 * wiec albo jest dataset, albo nie ma czego pokazac.
 */
export function StatementContentBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <QueryErrorBoundary
      sectionName="StatementContent"
      onError={onError}
      fallback={StatementErrorFallback}
    >
      {children}
    </QueryErrorBoundary>
  )
}
