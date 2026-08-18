/**
 * Publiczne API modulu Dashboard.
 *
 * Tylko ponizsze symbole moga byc importowane przez reszte aplikacji.
 * Wnetrze modulu (sekcje, wykresy, fetchery) zostaje prywatne, zeby
 * kontrakt przetrwal refaktory w srodku.
 *
 * Czyste typy: '@/features/dashboard/domain'. Serwer: '@/features/dashboard/server'.
 */
export { DashboardContent } from './components/DashboardContent'
export { DashboardSkeleton } from './components/DashboardSkeleton'
export { DashboardContentBoundary } from './components/errors'
export { useDashboardData } from './hooks/useDashboardData'
export { usePreferencesStore, useEffectiveEurRate } from './hooks/usePreferencesStore'
export { getDashboardData } from './services/dashboard.service'
