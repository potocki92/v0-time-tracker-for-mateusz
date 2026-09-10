/**
 * Publiczne API modulu Reports.
 *
 * Na zewnatrz wychodzi wylacznie widok trasy, jego skeleton i granica bledu.
 * Domena (`@/features/reports/domain`) i warstwa serwerowa
 * (`@/features/reports/server`) maja wlasne wejscia.
 *
 * ZASADA MODULARNOSCI: zaden inny feature nie importuje niczego z tego modulu.
 * Usuniecie katalogu `features/reports`, trasy `/reports`, wpisu w
 * `lib/workspace/sections.ts`, przestrzeni `reports` w `i18n/messages.ts`
 * i `app/api/reports` zostawia reszte aplikacji w stanie kompilowalnym —
 * patrz README.md, sekcja „Jak usunac ten modul".
 */
export { ReportsContent, ReportsContentBoundary, ReportsSkeleton } from './components'
