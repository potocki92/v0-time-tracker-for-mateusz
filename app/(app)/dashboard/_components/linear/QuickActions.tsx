'use client'

import Link from 'next/link'
import {
  Timer,
  FilePlus2,
  UserPlus,
  CalendarPlus,
  type LucideIcon,
} from 'lucide-react'

type Action = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  shortcut: string
  accent?: boolean
}

const ACTIONS: readonly Action[] = [
  {
    href: '/calendar?action=new',
    label: 'New entry',
    description: 'Log work hours',
    icon: Timer,
    shortcut: '⌘ + T',
    accent: true,
  },
  {
    href: '/invoices?action=new',
    label: 'New invoice',
    description: 'Bill a client',
    icon: FilePlus2,
    shortcut: '⌘ + I',
  },
  {
    href: '/clients?action=new',
    label: 'Add client',
    description: 'Register a new partner',
    icon: UserPlus,
    shortcut: '⌘ + K',
  },
  {
    href: '/calendar',
    label: 'Plan week',
    description: 'Open calendar',
    icon: CalendarPlus,
    shortcut: '⌘ + W',
  },
] as const

export function QuickActions() {
  return (
    <section
      aria-label="Szybkie akcje"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Quick actions</h2>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {ACTIONS.map(({ href, label, description, icon: Icon, shortcut, accent }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-3 transition sm:p-4 ${
              accent
                ? 'border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500/60 hover:bg-emerald-500/10'
                : 'border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#262626] hover:bg-[#111]'
            }`}
          >
            {accent && (
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/15 blur-2xl"
              />
            )}
            <div className="relative flex items-center justify-between">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  accent
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_-2px_rgba(34,197,94,0.6)]'
                    : 'bg-[#161616] text-zinc-300 ring-1 ring-[#1f1f1f]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <kbd className="rounded-md border border-[#1f1f1f] bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                {shortcut}
              </kbd>
            </div>
            <div className="relative">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
