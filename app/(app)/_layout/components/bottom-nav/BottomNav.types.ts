import type { ComponentType } from 'react'

export interface BottomNavItem {
  /** Ścieżka routera */
  href:  string
  /** Etykieta wyświetlana pod ikoną */
  label: string
  /** Ikona Lucide */
  icon:  ComponentType<{ className?: string }>
}
