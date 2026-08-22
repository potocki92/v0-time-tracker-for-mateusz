import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Users,
  FileText,
} from 'lucide-react'
import { WORKSPACE_SECTIONS, sectionHref, type WorkspaceSegment } from '@/lib/workspace/sections'
import type { BottomNavItem } from './BottomNav.types'

/** Sekcje z dolnego paska — codzienna praca, w kolejnosci z rejestru. */
const BOTTOM_NAV_ICONS: Partial<Record<WorkspaceSegment, BottomNavItem['icon']>> = {
  dashboard: LayoutDashboard,
  calendar:  Calendar,
  projects:  FolderKanban,
  clients:   Users,
  invoices:  FileText,
}

export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = WORKSPACE_SECTIONS.flatMap(
  (section) => {
    const icon = BOTTOM_NAV_ICONS[section.segment]
    if (!icon) return []
    return [{ href: sectionHref(section), label: section.label, icon }]
  },
)
