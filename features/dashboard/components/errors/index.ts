// app/(app)/dashboard/_components/errors/index.ts
export { ErrorBoundary } from './ErrorBoundary'
export { QueryErrorBoundary } from './QueryErrorBoundary'   // ⬅ NOWE
export { DefaultFallback } from './ErrorBoundary.fallback'
export {
  DashboardContentBoundary,                                  // ⬅ NOWE
  ChartErrorBoundary,
  InvoicesErrorBoundary,
  StatsErrorBoundary,
  EarningsCardBoundary,
  GoalCardBoundary,
} from './SectionBoundaries'
export type * from './ErrorBoundary.types'
