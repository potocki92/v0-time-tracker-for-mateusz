import { LucideIcon } from 'lucide-react'

export interface NavQuickAction {
  /** Cel nawigacji po kliknięciu (np. `/projects?new=1`). */
  href: string
  /** Klucz tekstu dla a11y (`aria-label`) w przestrzeni `navigation`. */
  labelKey: string
}

export interface NavBadge {
  /** Klucz statycznej etykiety w `navigation.badges`. Liczbę przekaż przez `count`. */
  labelKey?: string
}

export interface NavItem {
  href: string
  /** Klucz etykiety w przestrzeni `navigation` (np. `sections.projects`). */
  labelKey: string
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
  /** Klucz nagłówka grupy w `navigation.groups`. */
  labelKey: string
  items: NavItem[]
}
