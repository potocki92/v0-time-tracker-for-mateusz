/**
 * Server-only API modulu dashboard.
 *
 * Osobne wejscie, bo import 'server-only' nie moze trafic do bundla klienta.
 * Klient uzywa '@/features/dashboard', serwer '@/features/dashboard/server'.
 */
export { getDashboardDataServer } from './services/dashboard.service.server'
export {
  renderWeeklySummaryEmail,
  type WeeklySummaryEmail,
} from './services/weekly-summary.service.server'
