'use client'

import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InvoiceFilterTab } from '../../domain/stats'

interface InvoiceFilterToolbarProps {
  activeTab: InvoiceFilterTab
  onTabChange: (tab: InvoiceFilterTab) => void
  counts: {
    all: number
    open: number
    overdue: number
    paid: number
    drafts: number
  }
  query: string
  onQueryChange: (value: string) => void
  onCreate: () => void
}

const TABS: { value: InvoiceFilterTab; label: string; key: keyof InvoiceFilterToolbarProps['counts'] }[] = [
  { value: 'all', label: 'Wszystkie', key: 'all' },
  { value: 'open', label: 'Otwarte', key: 'open' },
  { value: 'overdue', label: 'Zaległe', key: 'overdue' },
  { value: 'paid', label: 'Opłacone', key: 'paid' },
  { value: 'drafts', label: 'Szkice', key: 'drafts' },
]

export function InvoiceFilterToolbar({
  activeTab,
  onTabChange,
  counts,
  query,
  onQueryChange,
  onCreate,
}: InvoiceFilterToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Wszystkie faktury
        </h2>
      </div>

      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filtry statusu faktur"
      >
        {TABS.map((tab) => {
          const active = tab.value === activeTab
          const count = counts[tab.key]
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                  : 'border-[#1a1a1a] bg-[#0a0a0a] text-zinc-300 hover:border-[#262626] hover:text-white',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-semibold tabular-nums',
                  active
                    ? 'bg-emerald-400/20 text-emerald-100'
                    : 'bg-[#141414] text-zinc-400',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Szukaj faktury, klienta, projektu..."
            aria-label="Szukaj faktury"
            className="h-11 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-400 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-black shadow-[0_0_22px_-6px_color-mix(in_oklab,var(--primary)_65%,transparent)] transition hover:bg-emerald-400 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nowa faktura
        </button>
      </div>
    </div>
  )
}
