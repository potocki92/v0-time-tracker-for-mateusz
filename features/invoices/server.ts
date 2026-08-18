/**
 * Server-only API modulu invoices.
 *
 * Osobne wejscie, zeby fetchery serwerowe nie trafialy do bundla klienta.
 * Klient uzywa '@/features/invoices', serwer '@/features/invoices/server'.
 */
export { getInvoicesDataServer } from './services/server/invoices.service.server'
