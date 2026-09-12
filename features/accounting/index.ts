/**
 * Publiczne API modulu „Wykaz dla ksiegowej".
 *
 * Na zewnatrz wychodzi wylacznie widok trasy, jego skeleton i granica bledu.
 * Domena (`@/features/accounting/domain`) i warstwa serwerowa
 * (`@/features/accounting/server`) maja wlasne wejscia.
 *
 * ZASADA MODULARNOSCI: zaden inny feature nie importuje niczego z tego modulu,
 * i ten modul nie importuje z zadnego innego feature'a — takze z `invoices`
 * i `reports`, z ktorymi dzieli tabele w bazie, ale nie kod. Usuniecie
 * katalogu `features/accounting`, trasy `/reports/accounting`, `app/api/accounting`
 * i przestrzeni `accounting` w `i18n/messages.ts` zostawia reszte aplikacji
 * w stanie kompilowalnym — patrz README.md.
 */
export { StatementContent, StatementContentBoundary, StatementSkeleton } from './components'
