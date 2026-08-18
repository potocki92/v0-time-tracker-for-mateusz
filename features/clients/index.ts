/**
 * Publiczne API modulu Clients.
 *
 * Tylko ponizsze symbole moga byc importowane przez reszte aplikacji.
 * Wnetrze modulu (selektory, fetchery, kolumny tabeli) zostaje prywatne,
 * zeby kontrakt przetrwal refaktory w srodku.
 */
export { ClientsContent } from './components/ClientsContent'
export { ClientsSkeleton } from './components/ClientsSkeleton'
export { ClientsContentBoundary } from './components/errors'
