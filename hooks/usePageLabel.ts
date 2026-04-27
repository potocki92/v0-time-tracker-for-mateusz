'use client'

import { usePathname } from 'next/navigation'

type PageLabel = {
  section: string
  page: string
}

const FALLBACK: PageLabel = { section: 'Obszar roboczy', page: 'TimeTracker' }

const APP_PAGE_MAP: Array<{ match: RegExp; label: PageLabel }> = [
  { match: /^\/dashboard(?:\/|$)/, label: { section: 'Obszar roboczy', page: 'Pulpit' } },
  { match: /^\/calendar(?:\/|$)/, label: { section: 'Obszar roboczy', page: 'Kalendarz' } },
  { match: /^\/clients(?:\/|$)/, label: { section: 'Rozliczenia', page: 'Klienci' } },
  { match: /^\/projects(?:\/|$)/, label: { section: 'Rozliczenia', page: 'Projekty' } },
  { match: /^\/invoices(?:\/|$)/, label: { section: 'Rozliczenia', page: 'Faktury' } },
  { match: /^\/settings(?:\/|$)/, label: { section: 'Ustawienia', page: 'Preferencje' } },
]

export function usePageLabel(): PageLabel {
  const pathname = usePathname() ?? ''
  const match = APP_PAGE_MAP.find((item) => item.match.test(pathname))
  return match?.label ?? FALLBACK
}
