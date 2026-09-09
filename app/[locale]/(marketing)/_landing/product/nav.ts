import {
  WORKSPACE_SECTIONS,
  type WorkspaceSection,
  type WorkspaceSegment,
} from '@/lib/workspace/sections'

/**
 * Nawigacja MOCKUPU aplikacji pokazywanego na landingu.
 *
 * Landing opowiada produkt scenami, a nie zakladkami panelu — i te dwie
 * struktury celowo NIE sa identyczne. Scena „Projekty" pokazuje projekty
 * RAZEM z klientami (patrz `screens/ProjectsScreen`: KPI „Klienci" i tabela
 * stawek), bo dla widza to jedna historia jednego modelu danych: klient
 * niesie stawke, projekt niesie budzet i godziny. Osobny wiersz „Klienci"
 * w mockupowym sidebarze rozbijalby te scene na dwie pozycje, z ktorych
 * druga nigdy by sie nie podswietlila.
 *
 * Dlatego `clients` jest tu UKRYTE, a nie usuniete: sekcja klientow dziala
 * w panelu normalnie (`/clients`) i zostaje w `WORKSPACE_SECTIONS`, ktore
 * pozostaje wspoldzielonym zrodlem prawdy dla prawdziwego sidebara,
 * breadcrumba i dolnego paska. Filtr zyje wylacznie w warstwie marketingu.
 */
const MARKETING_HIDDEN_SEGMENTS: readonly WorkspaceSegment[] = ['clients']

/**
 * Sekcje widoczne w mockupie — rejestr panelu minus lista ukrytych. Filtr,
 * a nie wlasna lista, bo dopisanie sekcji w produkcie ma nadal automatycznie
 * pojawiac sie w marketingowej replice (etykiety, skroty i badge'e tez).
 */
export const MARKETING_SECTIONS: readonly WorkspaceSection[] = WORKSPACE_SECTIONS.filter(
  (section) => !MARKETING_HIDDEN_SEGMENTS.includes(section.segment),
)

/**
 * Dolny pasek mobilny mockupu = widoczny obszar roboczy. Jedno wyprowadzenie
 * z `MARKETING_SECTIONS`, zeby sidebar i pasek nie mogly sie rozjechac.
 */
export const MARKETING_BOTTOM_SEGMENTS: readonly WorkspaceSegment[] = MARKETING_SECTIONS.filter(
  (section) => section.group === 'workspace',
).map((section) => section.segment)
