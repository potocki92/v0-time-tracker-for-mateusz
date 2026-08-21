import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
  LineChart,
  Target,
  Wallet,
  Plug,
  Workflow,
  Sparkles,
} from 'lucide-react'
import {
  WORKSPACE_GROUP_LABELS,
  WORKSPACE_SECTIONS,
  sectionHref,
  type WorkspaceGroup,
  type WorkspaceSegment,
} from '@/lib/workspace/sections'
import { NavItem, NavQuickAction, NavSection, PinnedItem } from '../types/nav.types'

/**
 * Konfiguracja nawigacji bocznej.
 *
 * Kolejnosc, etykiety, skroty i badge'e pochodza z rejestru sekcji
 * (`lib/workspace/sections.ts`) — ten sam rejestr zasila breadcrumb w
 * naglowku i dolna nawigacje. Tutaj zostaje wylacznie warstwa prezentacji:
 * ikona i inline Quick Action ("+").
 */
const SECTION_ICONS: Record<WorkspaceSegment, NavItem['icon']> = {
  dashboard:      LayoutDashboard,
  calendar:       Calendar,
  projects:       FolderKanban,
  clients:        Users,
  invoices:       FileText,
  reports:        LineChart,
  goals:          Target,
  earnings:       Wallet,
  'ai-assistant': Sparkles,
  integrations:   Plug,
  automations:    Workflow,
}

/** Szybki "+" na hover — tylko tam, gdzie sekcja ma formularz dodawania. */
const SECTION_QUICK_ACTIONS: Partial<Record<WorkspaceSegment, NavQuickAction>> = {
  projects: { href: '/projects?new=1', label: 'Dodaj projekt' },
  clients:  { href: '/clients?new=1',  label: 'Dodaj klienta' },
}

const GROUP_ORDER: WorkspaceGroup[] = ['workspace', 'stats', 'automation']

export const NAV_SECTIONS: NavSection[] = GROUP_ORDER.map((group) => ({
  id: group,
  label: WORKSPACE_GROUP_LABELS[group],
  items: WORKSPACE_SECTIONS.filter((section) => section.group === group).map((section) => ({
    href: sectionHref(section),
    label: section.label,
    icon: SECTION_ICONS[section.segment],
    shortcut: section.shortcut,
    quickAction: SECTION_QUICK_ACTIONS[section.segment],
    badge: section.badge ? { label: section.badge } : undefined,
  })),
}))

/**
 * Pinned: szybkie skróty do najczęściej używanych zasobów (projektów / klientów).
 * Każdy element musi prowadzić do KONKRETNEGO zasobu — używamy `?q=` jako filtra
 * na liście projektów (zgodnie z konwencją z innych miejsc w aplikacji), żeby
 * kliknięcie otwierało dany projekt zamiast tylko strony zbiorczej.
 */
export const PINNED_ITEMS: PinnedItem[] = [
  {
    label: 'Hans-Böckler-Str. 284',
    href:  '/projects?q=Hans-B%C3%B6ckler-Str.%20284',
    color: '#C97A8A',
  },
  {
    label: 'Im Winkel 51',
    href:  '/projects?q=Im%20Winkel%2051',
    color: '#7898C5',
  },
  {
    label: 'Gustavsburger 25–35',
    href:  '/projects?q=Gustavsburger%2025-35',
    color: '#8FB89A',
  },
]
