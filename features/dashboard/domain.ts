/**
 * Czysta warstwa domenowa modulu Dashboard — typy bez Reacta.
 *
 * Osobne wejscie, zeby `lib/` i `hooks/` mogly siegnac po TimeRange czy Goal
 * bez wciagania komponentow dashboardu.
 */
export type {
  TimeRange,
  ChartGrouping,
  ChartDataItem,
  Currency,
  Goal,
  DashboardData,
} from './types/dashboard.types'
