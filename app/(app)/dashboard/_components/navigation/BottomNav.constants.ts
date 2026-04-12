import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
} from 'lucide-react'
import type { NavItem } from './BottomNav.types'

/**
 * Definicja elementów nawigacji.
 * `prefetch: true` — dane prefetchowane na hover/focus linka.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href:     '/dashboard',
    label:    'Dashboard',
    icon:     LayoutDashboard,
    prefetch: true,           // ← prefetch danych dashboardu
  },
  {
    href:  '/calendar',
    label: 'Kalendarz',
    icon:  Calendar,
  },
  {
    href:  '/projects',
    label: 'Projekty',
    icon:  FolderKanban,
  },
  {
    href:  '/clients',
    label: 'Klienci',
    icon:  Users,
  },
  {
    href:  '/invoices',
    label: 'Faktury',
    icon:  FileText,
  },
] as const