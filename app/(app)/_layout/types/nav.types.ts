import { LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  shortcut?: string
  count?: number
}

export interface PinnedItem {
  href: string
  label: string
  color: string
}

export interface NavSection {
  id: string
  label: string
  items: NavItem[]
}
