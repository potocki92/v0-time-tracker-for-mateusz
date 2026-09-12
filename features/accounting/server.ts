/**
 * Server-only API modulu „Wykaz dla ksiegowej".
 *
 * Osobne wejscie, zeby fetchery serwerowe nie trafily do bundla klienta.
 * Klient uzywa '@/features/accounting', serwer '@/features/accounting/server'.
 */
export { getAccountingDatasetServer } from './services/accounting.service.server'
export {
  accountingQueryOptions,
  parseAccountingSearchParams,
  type AccountingQueryParams,
} from './services/accounting.query'
