'use client'

import Link from 'next/link'
import { ArrowUpRight, ChevronRight, CheckCircle2, Clock } from 'lucide-react'

export type ProjectStatus = 'in_progress' | 'completed' | 'planned'

export type ProjectItem = {
  id: string
  name: string
  progress: number
  status: ProjectStatus
  color: string
}

type Props = {
  projects: ProjectItem[]
  totalActive: number
}

const STATUS_PILL: Record<
  ProjectStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  in_progress: {
    label: 'W trakcie',
    className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    icon: Clock,
  },
  completed: {
    label: 'Zakończone',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    icon: CheckCircle2,
  },
  planned: {
    label: 'Zaplanowane',
    className: 'bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30',
    icon: Clock,
  },
}

export function ProjectsCard({ projects, totalActive }: Props) {
  return (
    <section
      aria-label="Projekty"
      className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <header className="flex items-center justify-between border-b border-[#161616] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Projekty
          </p>
          <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] text-zinc-300">
            {totalActive} aktywne
          </span>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-[#141414] hover:text-white"
        >
          Zobacz wszystkie
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-500 sm:px-5">
          Brak projektów.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-[#161616]">
          {projects.map((p) => {
            const pill = STATUS_PILL[p.status]
            return (
              <li key={p.id}>
                <Link
                  href={`/projects?id=${encodeURIComponent(p.id)}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#0c0c0c] sm:px-5"
                >
                  <span
                    aria-hidden
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{
                      backgroundColor: p.color,
                      boxShadow: `0 0 8px ${p.color}55`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium leading-[1.35] text-white sm:text-sm">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pill.className}`}
                      >
                        <pill.icon className="h-3 w-3" aria-hidden />
                        {pill.label}
                      </span>
                      <span className="text-[11.5px] tabular-nums text-zinc-400 sm:text-xs">
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
