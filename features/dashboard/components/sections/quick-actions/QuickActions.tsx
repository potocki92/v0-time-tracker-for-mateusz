'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import Link from 'next/link'
import {
  Play,
  FileText,
  FolderPlus,
  UserPlus,
  CalendarOff,
  Download,
  Command,
  type LucideIcon,
} from 'lucide-react'

type Action = {
  href: string
  label: string
  icon: LucideIcon
  shortcut: string
  highlight?: boolean
}

const ACTIONS: readonly Action[] = [
  { href: '/calendar?action=new', label: 'Uruchom timer', icon: Play, shortcut: '⌘ T', highlight: true },
  { href: '/invoices?action=new', label: 'Nowa faktura', icon: FileText, shortcut: '⌘ I' },
  { href: '/projects?action=new', label: 'Nowy projekt', icon: FolderPlus, shortcut: '⌘ P' },
  { href: '/clients?action=new', label: 'Dodaj klienta', icon: UserPlus, shortcut: '⌘ U' },
  { href: '/calendar?action=time-off', label: 'Dodaj nieobecność', icon: CalendarOff, shortcut: '' },
  { href: '/invoices?action=export', label: 'Eksport miesiąca', icon: Download, shortcut: '' },
] as const

export function QuickActions() {
  return (
    <section
      aria-label="Szybkie akcje"
      className="rounded-lg border border-hairline bg-surface-1 p-4"
    >
      <header className="flex items-center justify-between">
        <SectionEyebrow>Szybkie akcje</SectionEyebrow>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-hairline bg-surface-2 text-zinc-400">
          <Command className="h-3.5 w-3.5" aria-hidden />
        </span>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {ACTIONS.map(({ href, label, icon: Icon, shortcut, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-start gap-3 overflow-hidden rounded-lg border p-3 transition ${
              highlight
                ? 'border-hairline bg-[#0e120e] hover:border-emerald-500/40 hover:bg-emerald-500/[0.08]'
                : 'border-hairline bg-surface-2 hover:border-hairline-strong hover:bg-surface-3'
            }`}
          >
            {highlight && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-emerald-500 shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
              />
            )}
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                highlight
                  ? 'text-emerald-400'
                  : 'text-zinc-300'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-[1.3] text-white sm:text-sm">{label}</p>
              {shortcut && (
                <kbd className="mt-1 inline-block font-mono text-2xs tracking-wider text-zinc-400">
                  {shortcut}
                </kbd>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
