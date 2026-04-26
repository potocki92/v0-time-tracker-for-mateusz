import {
  Home,
  Calendar,
  Briefcase,
  Users,
  Receipt,
} from 'lucide-react'
import type { BottomNavItem } from './BottomNav.types'

export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    href:     '/dashboard',
    label:    'Pulpit',
    icon:     Home,
    prefetch: true,
  },
  {
    href:  '/calendar',
    label: 'Kalendarz',
    icon:  Calendar,
  },
  {
    href:  '/projects',
    label: 'Projekty',
    icon:  Briefcase,
  },
  {
    href:  '/clients',
    label: 'Klienci',
    icon:  Users,
  },
  {
    href:  '/invoices',
    label: 'Faktury',
    icon:  Receipt,
  },
] as const
