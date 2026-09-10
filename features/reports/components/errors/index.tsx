import { QueryErrorBoundary } from '@/components/common/errors'
import type { SectionBoundaryProps } from '@/components/common/errors'
import { ReportsErrorFallback } from './ReportsErrorFallback'

/**
 * Granica bledu raportu. Jeden wariant wystarczy: raport to jedno zapytanie,
 * wiec albo jest dataset, albo nie ma czego liczyc.
 */
export function ReportsContentBoundary({ children, onError }: SectionBoundaryProps) {
  return (
    <QueryErrorBoundary
      sectionName="ReportsContent"
      onError={onError}
      fallback={ReportsErrorFallback}
    >
      {children}
    </QueryErrorBoundary>
  )
}
