'use client'

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
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <header className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Szybkie akcje
        </p>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-500">
          <Command className="h-3.5 w-3.5" aria-hidden />
        </span>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {ACTIONS.map(({ href, label, icon: Icon, shortcut, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-start gap-3 overflow-hidden rounded-xl border p-3 transition ${
              highlight
                ? 'border-[#1a1a1a] bg-[#0e120e] hover:border-emerald-500/40 hover:bg-emerald-500/[0.08]'
                : 'border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#262626] hover:bg-[#111]'
            }`}
          >
            {highlight && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"
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
              <p className="text-[13px] font-semibold leading-[1.3] text-white sm:text-sm">{label}</p>
              {shortcut && (
                <kbd className="mt-1 inline-block font-mono text-[10px] tracking-wider text-zinc-500">
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
