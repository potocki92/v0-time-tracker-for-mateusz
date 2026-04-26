import { LucideIcon } from 'lucide-react'

export interface NavQuickAction {
  /** Cel nawigacji po kliknięciu (np. `/projects?new=1`). */
  href: string
  /** Tekst dla a11y (`aria-label`). */
  label: string
}

export interface NavBadge {
  /** Wariant wizualny — paleta tokenów design systemu. */
  variant?: 'primary' | 'warning' | 'muted'
  /** Statyczny tekst (np. "Beta") wyświetlany zamiast liczby. */
  label?: string
}

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  shortcut?: string
  count?: number
  /** Akcja inline (np. "+") pojawiająca się na hover w prawej części wiersza. */
  quickAction?: NavQuickAction
  /** Konfiguracja badge — np. liczba nieopłaconych faktur lub etykieta "Beta". */
  badge?: NavBadge
}

export interface PinnedItem {
  /** Identyfikator projektu/zasobu (używany w URL `/projects?id=…`) */
  id?: string
  href: string
  label: string
  color: string
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}
