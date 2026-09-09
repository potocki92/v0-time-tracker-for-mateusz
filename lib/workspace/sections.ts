/**
 * Rejestr sekcji panelu — jedyne zrodlo prawdy dla nawigacji.
 *
 * Czytaja z niego: sidebar (`nav.config.ts`), dolna nawigacja mobilna,
 * breadcrumb w `WorkspaceHeader`, tytuly stron i testy. Kolejnosc wpisow jest
 * kolejnoscia pozycji w sidebarze.
 */

export type WorkspaceGroup = 'workspace' | 'stats' | 'automation'

/**
 * Etykiety NIE mieszkaja w rejestrze — rejestr jest strukturą, a nie copy.
 * Nazwy grup i sekcji stoja w `messages/<locale>/navigation.json` pod
 * kluczami `groups.<group>` i `sections.<segment>`; konsument tlumaczy je
 * przez `useTranslations('navigation')`.
 */

/**
 * Segmenty sciezek panelu. Unia stoi obok tablicy celowo: dopisanie sekcji bez
 * dopisania segmentu tutaj jest bledem kompilacji, a `Record<WorkspaceSegment, …>`
 * u konsumentow (ikony w sidebarze) wymusza komplet wpisow.
 */
export type WorkspaceSegment =
  | 'dashboard'
  | 'calendar'
  | 'projects'
  | 'clients'
  | 'invoices'
  | 'reports'
  | 'goals'
  | 'earnings'
  | 'ai-assistant'
  | 'integrations'
  | 'automations'

export interface WorkspaceSection {
  /**
   * Pierwszy segment sciezki panelu, np. "projects". Jest jednoczesnie
   * KLUCZEM tlumaczenia (`navigation.sections.<segment>`).
   */
  segment: WorkspaceSegment
  group: WorkspaceGroup
  /**
   * Czy sekcja ma wlasna trase w `app/[locale]/(app)`. `false` = pozycja zapowiedziana
   * w sidebarze, prowadzaca do kotwicy `#segment` zamiast do strony.
   */
  routed: boolean
  /** Skrot klawiszowy pokazywany w sidebarze. */
  shortcut?: string
  /** Klucz wskaznika w sidebarze — `navigation.badges.<badge>`. */
  badge?: 'beta' | 'new' | 'integrations'
}

export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  { segment: 'dashboard',    group: 'workspace',  routed: true,  shortcut: 'D' },
  { segment: 'calendar',     group: 'workspace',  routed: true,  shortcut: 'C' },
  { segment: 'projects',     group: 'workspace',  routed: true,  shortcut: 'P' },
  { segment: 'clients',      group: 'workspace',  routed: true },
  { segment: 'invoices',     group: 'workspace',  routed: true,  shortcut: 'I' },
  { segment: 'reports',      group: 'stats',      routed: true },
  { segment: 'goals',        group: 'stats',      routed: false },
  { segment: 'earnings',     group: 'stats',      routed: false },
  { segment: 'ai-assistant', group: 'stats',      routed: false, badge: 'beta' },
  { segment: 'integrations', group: 'automation', routed: false, badge: 'integrations' },
  { segment: 'automations',  group: 'automation', routed: false, badge: 'new' },
]

/**
 * Trasy zagniezdzone, ktorych ostatni segment nie jest nazwa encji — tam
 * surowy segment z URL-a bylby zla etykieta breadcrumba. Wartosc jest
 * KLUCZEM `navigation.nested.<key>`.
 */
const NESTED_LABEL_KEYS = ['invoices/analytics'] as const

const pathSegments = (pathname: string) =>
  pathname.split(/[?#]/)[0].split('/').filter(Boolean)

/** Cel nawigacji dla pozycji sidebara / dolnego paska. */
export function sectionHref(section: WorkspaceSection): string {
  return section.routed ? `/${section.segment}` : `#${section.segment}`
}

/**
 * Sekcja dla biezacej sciezki. Dopasowanie idzie po PIERWSZYM segmencie, wiec
 * trasy zagniezdzone (`/projects/[id]`, `/invoices/analytics`) trafiaja na
 * swoja sekcje nadrzedna.
 */
export function resolveSection(pathname: string): WorkspaceSection | undefined {
  const [head] = pathSegments(pathname)
  if (!head) return undefined
  return WORKSPACE_SECTIONS.find((section) => section.routed && section.segment === head)
}

/**
 * Trzeci czlon breadcrumba dla trasy zagniezdzonej.
 *
 * Zwraca albo `{ key }` — klucz tlumaczenia z `navigation.nested` — albo
 * `{ text }`, gdy ostatni segment jest NAZWA ENCJI z URL-a. Nazwy encji
 * (projekt, klient, numer faktury) to dane uzytkownika i NIE podlegaja
 * tlumaczeniu. `undefined` na trasie sekcji.
 */
export function resolveNestedLabel(
  pathname: string,
): { key: string } | { text: string } | undefined {
  const segments = pathSegments(pathname)
  if (segments.length < 2) return undefined
  const joined = segments.join('/')
  if ((NESTED_LABEL_KEYS as readonly string[]).includes(joined)) return { key: joined }
  return { text: decodeURIComponent(segments[segments.length - 1]) }
}
