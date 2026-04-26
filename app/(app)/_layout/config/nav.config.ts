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
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
      { href: '/calendar',  label: 'Kalendarz', icon: Calendar,        shortcut: 'C' },
      { href: '/projects',  label: 'Projekty',  icon: FolderKanban,    shortcut: 'P' },
      { href: '/clients',   label: 'Klienci',   icon: Users },
      { href: '/invoices',  label: 'Faktury',   icon: FileText,        shortcut: 'I' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { href: '#reports',  label: 'Raporty', icon: LineChart },
      { href: '#goals',    label: 'Cele',    icon: Target },
      { href: '#earnings', label: 'Zarobki', icon: Wallet },
    ],
  },
]

export const PINNED_ITEMS: PinnedItem[] = [
  { href: '/projects', label: 'Hans-Böckler-Str. 284', color: '#C97A8A' },
  { href: '/projects', label: 'Im Winkel 51',          color: '#7898C5' },
  { href: '/projects', label: 'Gustavsburger 25–35',   color: '#8FB89A' },
]
