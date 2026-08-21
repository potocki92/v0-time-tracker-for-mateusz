/**
 * Rejestr sekcji panelu — jedyne zrodlo prawdy dla nawigacji.
 *
 * Czytaja z niego: sidebar (`nav.config.ts`), dolna nawigacja mobilna,
 * breadcrumb w `WorkspaceHeader`, tytuly stron i testy. Kolejnosc wpisow jest
 * kolejnoscia pozycji w sidebarze.
 */

export type WorkspaceGroup = 'workspace' | 'stats' | 'automation'

export const WORKSPACE_GROUP_LABELS: Record<WorkspaceGroup, string> = {
  workspace: 'Obszar roboczy',
  stats: 'Statystyki',
  automation: 'Automatyzacja',
}

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
  /** Pierwszy segment sciezki panelu, np. "projects". */
  segment: WorkspaceSegment
  label: string
  group: WorkspaceGroup
  /**
   * Czy sekcja ma wlasna trase w `app/(app)`. `false` = pozycja zapowiedziana
   * w sidebarze, prowadzaca do kotwicy `#segment` zamiast do strony.
   */
  routed: boolean
  /** Skrot klawiszowy pokazywany w sidebarze. */
  shortcut?: string
  /** Etykieta wskaznika w sidebarze (np. "Beta"). */
  badge?: string
}

export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  { segment: 'dashboard',    label: 'Pulpit',        group: 'workspace',  routed: true,  shortcut: 'D' },
  { segment: 'calendar',     label: 'Kalendarz',     group: 'workspace',  routed: true,  shortcut: 'C' },
  { segment: 'projects',     label: 'Projekty',      group: 'workspace',  routed: true,  shortcut: 'P' },
  { segment: 'clients',      label: 'Klienci',       group: 'workspace',  routed: true },
  { segment: 'invoices',     label: 'Faktury',       group: 'workspace',  routed: true,  shortcut: 'I' },
  { segment: 'reports',      label: 'Raporty',       group: 'stats',      routed: true },
  { segment: 'goals',        label: 'Cele',          group: 'stats',      routed: false },
  { segment: 'earnings',     label: 'Zarobki',       group: 'stats',      routed: false },
  { segment: 'ai-assistant', label: 'Asystent AI',   group: 'stats',      routed: false, badge: 'Beta' },
  { segment: 'integrations', label: 'Integracje',    group: 'automation', routed: false, badge: 'Slack · Trello' },
  { segment: 'automations',  label: 'Automatyzacje', group: 'automation', routed: false, badge: 'Nowość' },
]

/**
 * Trasy zagniezdzone, ktorych ostatni segment nie jest nazwa encji — tam
 * surowy segment z URL-a bylby zla etykieta breadcrumba.
 */
const NESTED_LABELS: Record<string, string> = {
  'invoices/analytics': 'Analityka',
}

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
 * Trzeci czlon breadcrumba dla trasy zagniezdzonej — nazwa encji z URL-a
 * albo etykieta z `NESTED_LABELS`. `undefined` na trasie sekcji.
 */
export function resolveNestedLabel(pathname: string): string | undefined {
  const segments = pathSegments(pathname)
  if (segments.length < 2) return undefined
  return NESTED_LABELS[segments.join('/')] ?? decodeURIComponent(segments[segments.length - 1])
}

/** Tytul strony w spojnym formacie `Sekcja · TimeTracker`. */
export function workspaceMetadata(segment: WorkspaceSegment): { title: string } {
  const section = WORKSPACE_SECTIONS.find((entry) => entry.segment === segment)!
  return { title: `${section.label} · TimeTracker` }
}
