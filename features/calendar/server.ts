/**
 * Server-only API modulu calendar.
 *
 * Osobne wejscie, bo import 'server-only' nie moze trafic do bundla klienta.
 * Klient uzywa '@/features/calendar', serwer '@/features/calendar/server'.
 */
export { getCalendarDataServer } from './services/calendar.service.server'
