'use client'

import { ChevronRight, Plus } from 'lucide-react'

export type UpcomingCategory = 'vacation' | 'billing' | 'project' | 'finance' | 'event'

export type UpcomingItem = {
  id: string
  date: Date
  title: string
  category: UpcomingCategory
  href?: string
}

type Props = {
  items: UpcomingItem[]
  onAdd?: () => void
}

const CATEGORY_PILL: Record<UpcomingCategory, string> = {
  vacation: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  billing: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  project: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
  finance: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  event: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
}

const CATEGORY_LABEL: Record<UpcomingCategory, string> = {
  vacation: 'Vacation',
  billing: 'Billing',
  project: 'Project',
  finance: 'Finance',
  event: 'Event',
}

function dayLabel(d: Date): { day: string; month: string } {
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

export function UpcomingCard({ items, onAdd }: Props) {
  return (
    <section
      aria-label="Upcoming"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <header className="flex items-center justify-between border-b border-[#161616] px-4 py-3 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Upcoming
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-[#262626] hover:bg-[#141414]"
        >
          <Plus className="h-3 w-3" aria-hidden />
          Add
        </button>
      </header>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-500 sm:px-5">
          Nothing scheduled.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-[#161616]">
          {items.map((it) => {
            const { day, month } = dayLabel(it.date)
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex w-10 flex-col items-center text-center">
                  <span className="text-base font-bold tabular-nums text-white">{day}</span>
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-500">
                    {month}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{it.title}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_PILL[it.category]}`}
                  >
                    {CATEGORY_LABEL[it.category]}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
