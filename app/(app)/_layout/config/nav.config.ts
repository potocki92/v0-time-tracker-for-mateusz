import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
  Settings,
} from 'lucide-react'
import { NavItem } from '../types/nav.types'

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Kalendarz', icon: Calendar },
  { href: '/projects', label: 'Projekty', icon: FolderKanban },
  { href: '/clients', label: 'Klienci', icon: Users },
  { href: '/invoices', label: 'Faktury', icon: FileText },
]