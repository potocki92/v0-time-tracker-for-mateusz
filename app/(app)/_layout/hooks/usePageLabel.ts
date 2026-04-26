'use client'

import { usePathname } from 'next/navigation'
import { NAV_SECTIONS } from '../config/nav.config'

interface PageLabel {
  /** Etykieta sekcji nadrzędnej (np. "Obszar roboczy") */
  section: string
  /** Etykieta podstrony (np. "Pulpit") */
  page: string
}

const FALLBACK: PageLabel = { section: 'Obszar roboczy', page: 'TimeTracker' }

/**
 * Wyznacza breadcrumb (Workspace > Page) na podstawie aktualnej ścieżki.
 * Korzysta z tej samej konfiguracji nawigacji co sidebar — dzięki temu
 * etykiety są spójne z menu.
 */
export function usePageLabel(): PageLabel {
  const pathname = usePathname() ?? ''

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return { section: section.label, page: item.label }
      }
    }
  }

  return FALLBACK
}
