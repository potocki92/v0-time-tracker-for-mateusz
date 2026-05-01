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
import { NavSection, PinnedItem } from '../types/nav.types'

/**
 * Konfiguracja nawigacji bocznej.
 *
 * Sekcje:
 *  • Workspace  — codzienna praca (Pulpit, Kalendarz, Projekty, Klienci, Faktury)
 *  • Insights   — analityka (Raporty, Cele, Zarobki, Asystent AI)
 *  • Automation — moduły zwiększające postrzeganą wartość produktu (Integracje,
 *    Automatyzacje). Tutaj projektant aplikacji "obiecuje" auto-fakturowanie,
 *    Slack/Trello sync etc. — to są dźwignie do up-sellu.
 *
 * Każdy element może mieć:
 *  • `quickAction` — szybki "+" na hover (Projekty, Klienci),
 *  • `badge`       — wskaźnik (np. nieopłacone faktury, "Beta", "Nowość").
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    label: 'Obszar roboczy',
    items: [
      { href: '/dashboard', label: 'Pulpit',    icon: LayoutDashboard, shortcut: 'D' },
      { href: '/calendar',  label: 'Kalendarz', icon: Calendar,        shortcut: 'C' },
      {
        href: '/projects',
        label: 'Projekty',
        icon: FolderKanban,
        shortcut: 'P',
        quickAction: { href: '/projects?new=1', label: 'Dodaj projekt' },
      },
      {
        href: '/clients',
        label: 'Klienci',
        icon: Users,
        quickAction: { href: '/clients?new=1', label: 'Dodaj klienta' },
      },
      { href: '/invoices', label: 'Faktury', icon: FileText, shortcut: 'I' },
    ],
  },
  {
    id: 'insights',
    label: 'Statystyki',
    items: [
      { href: '/reports', label: 'Raporty', icon: LineChart },
      { href: '#goals',    label: 'Cele',    icon: Target },
      { href: '#earnings', label: 'Zarobki', icon: Wallet },
      {
        href: '#ai-assistant',
        label: 'Asystent AI',
        icon: Sparkles,
        badge: { label: 'Beta' },
      },
    ],
  },
  {
    id: 'automation',
    label: 'Automatyzacja',
    items: [
      {
        href: '#integrations',
        label: 'Integracje',
        icon: Plug,
        badge: { label: 'Slack · Trello' },
      },
      {
        href: '#automations',
        label: 'Automatyzacje',
        icon: Workflow,
        badge: { label: 'Nowość' },
      },
    ],
  },
]

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
