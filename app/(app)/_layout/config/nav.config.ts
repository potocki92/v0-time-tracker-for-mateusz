import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
  LineChart,
  Target,
  Wallet,
} from 'lucide-react'
import { NavSection, PinnedItem } from '../types/nav.types'

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'workspace',
    label: 'Obszar roboczy',
    items: [
      { href: '/dashboard', label: 'Pulpit',    icon: LayoutDashboard, shortcut: 'D' },
      { href: '/calendar',  label: 'Kalendarz', icon: Calendar,        shortcut: 'C' },
      { href: '/projects',  label: 'Projekty',  icon: FolderKanban,    shortcut: 'P' },
      { href: '/clients',   label: 'Klienci',   icon: Users },
      { href: '/invoices',  label: 'Faktury',   icon: FileText,        shortcut: 'I' },
    ],
  },
  {
    id: 'insights',
    label: 'Statystyki',
    items: [
      { href: '#reports',  label: 'Raporty', icon: LineChart },
      { href: '#goals',    label: 'Cele',    icon: Target },
      { href: '#earnings', label: 'Zarobki', icon: Wallet },
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
