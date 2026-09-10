/**
 * Server-only API modulu Reports.
 *
 * Osobne wejscie, bo import 'server-only' nie moze trafic do bundla klienta.
 * Klient uzywa '@/features/reports', serwer '@/features/reports/server'.
 */
export { getReportsDatasetServer } from './services/reports.service.server'
export {
  parseReportsSearchParams,
  reportsQueryOptions,
  type ReportsQueryParams,
} from './services/reports.query'
