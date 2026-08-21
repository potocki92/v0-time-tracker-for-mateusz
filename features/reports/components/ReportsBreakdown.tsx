'use client'

import { FolderOpen } from 'lucide-react'
import type { ProjectUsage } from '../lib/types'

type Props = {
  items: ProjectUsage[]
}

const MAX_VISIBLE = 8

export function ReportsBreakdown({ items }: Props) {
  return (
    <section
      aria-label="Podział na projekty"
      className="rounded-2xl border border-hairline bg-surface-1 p-4 sm:p-5"
    >
      <header className="flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Projekty
        </p>
        {items.length > 0 && (
          <span className="text-2xs text-zinc-400">
            {items.length === 1 ? '1 projekt' : `${items.length} projektów`}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul role="list" className="mt-4 space-y-3.5">
          {items.slice(0, MAX_VISIBLE).map((p) => (
            <BreakdownRow key={p.label} item={p} />
          ))}
        </ul>
      )}
    </section>
  )
}

function BreakdownRow({ item }: { item: ProjectUsage }) {
  const width = Math.max(0, Math.min(100, item.share))

  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm text-zinc-200">{item.label}</span>
        <span className="shrink-0 tabular-nums text-sm text-zinc-300">
          {item.hours.toFixed(1)}
          <span className="text-xs text-zinc-400">h</span>
          <span className="ml-2 text-xs text-zinc-400">{Math.round(item.share)}%</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(item.share)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${item.label}: ${Math.round(item.share)}%`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-zinc-300 to-white"
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-surface-2 px-4 py-10 text-center">
      <FolderOpen aria-hidden className="size-6 text-zinc-400" />
      <p className="text-sm text-zinc-400">Brak danych w wybranym zakresie</p>
      <p className="text-xs text-zinc-400">Zmień filtry, aby zobaczyć podział pracy</p>
    </div>
  )
}
