import type { ComponentType } from 'react'

import type { WorkspaceSegment } from '@/lib/workspace/sections'

export interface BottomNavItem {
  /** Ścieżka routera */
  href:  string
  /** Segment sekcji = klucz etykiety `navigation.sections.<segment>` */
  segment: WorkspaceSegment
  /** Ikona Lucide */
  icon:  ComponentType<{ className?: string }>
}
