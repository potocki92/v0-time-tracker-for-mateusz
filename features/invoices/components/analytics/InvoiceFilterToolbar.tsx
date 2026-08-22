'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { Plus, Search } from 'lucide-react'
import { WorkspaceHeaderActions } from '@/components/workspace/workspace-header-slot'
import { Button } from '@/components/ui/button'
import { LINEAR } from '@/components/ui/tokens'
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
      <WorkspaceHeaderActions>
        <Button variant="accent" size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nowa faktura
        </Button>
      </WorkspaceHeaderActions>

      <div className="flex items-center justify-between gap-2">
        <SectionEyebrow as="h2">Wszystkie faktury</SectionEyebrow>
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
                  : 'border-hairline bg-surface-1 text-zinc-300 hover:border-hairline-strong hover:text-white',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-2xs font-semibold tabular-nums',
                  active
                    ? 'bg-emerald-400/20 text-emerald-100'
                    : 'bg-surface-3 text-zinc-400',
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
            className={cn(
              'h-11 w-full rounded-xl border pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-400 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              LINEAR.border,
              LINEAR.surface,
            )}
          />
        </div>
      </div>
    </div>
  )
}
