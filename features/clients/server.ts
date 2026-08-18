/**
 * Server-only API modulu clients.
 *
 * Osobne wejscie, bo import 'server-only' nie moze trafic do bundla klienta.
 * Klient uzywa '@/features/clients', serwer '@/features/clients/server'.
 */
export { getClientsDataServer } from './services/clients.service.server'
