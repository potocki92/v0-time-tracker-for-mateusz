import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
} from 'lucide-react'
import type { BottomNavItem } from './BottomNav.types'

export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    href:  '/dashboard',
    label: 'Pulpit',
    icon:  LayoutDashboard,
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
