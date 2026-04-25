import {
  Home,
  Calendar,
  Briefcase,
  Users,
  Receipt,
} from 'lucide-react'
import type { NavItem } from './BottomNav.types'

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href:     '/dashboard',
    label:    'Home',
    icon:     Home,
    prefetch: true,
  },
  {
    href:  '/calendar',
    label: 'Calendar',
    icon:  Calendar,
  },
  {
    href:  '/projects',
    label: 'Work',
    icon:  Briefcase,
  },
  {
    href:  '/clients',
    label: 'Clients',
    icon:  Users,
  },
  {
    href:  '/invoices',
    label: 'Bills',
    icon:  Receipt,
  },
] as const