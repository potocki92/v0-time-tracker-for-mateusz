'use client'

import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
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
      className="rounded-lg border border-hairline bg-surface-1"
    >
      <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <SectionEyebrow>Projekty</SectionEyebrow>
          <span className="rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-2xs text-zinc-300">
            {totalActive} aktywne
          </span>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium text-zinc-300 transition hover:bg-surface-3 hover:text-white"
        >
          Zobacz wszystkie
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-zinc-400">
          Brak projektów.
        </div>
      ) : (
        <ul role="list" className="divide-y divide-hairline">
          {projects.map((p) => {
            const pill = STATUS_PILL[p.status]
            return (
              <li key={p.id}>
                <Link
                  href={`/projects?id=${encodeURIComponent(p.id)}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-1"
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
                    <p className="truncate text-xs font-medium leading-[1.35] text-white sm:text-sm">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${pill.className}`}
                      >
                        <pill.icon className="h-3 w-3" aria-hidden />
                        {pill.label}
                      </span>
                      <span className="text-2xs tabular-nums text-zinc-400 sm:text-xs">
                        {p.progress}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
