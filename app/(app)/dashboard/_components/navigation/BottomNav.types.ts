import type { ComponentType } from 'react'

export interface NavItem {
  /** Ścieżka routera */
  href:  string
  /** Etykieta wyświetlana pod ikoną */
  label: string
  /** Ikona Lucide */
  icon:  ComponentType<{ className?: string }>
  /** Czy ten link powinien prefetchować dane na hover */
  prefetch?: boolean
}