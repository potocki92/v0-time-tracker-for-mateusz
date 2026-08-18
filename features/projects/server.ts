/**
 * Server-only API modulu projects.
 *
 * Osobne wejscie, bo import 'server-only' nie moze trafic do bundla klienta.
 * Klient uzywa '@/features/projects', serwer '@/features/projects/server'.
 */
export { getProjectsDataServer } from './services/projects.service.server'
