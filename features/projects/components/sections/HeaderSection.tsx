'use client'

import { Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LINEAR } from '../linear/linear.tokens'

type HeaderSectionProps = {
  total: number
  onCreate?: () => void
  onExport?: () => void
}

function currentPeriodLabel(): string {
  return new Date()
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()
}

export function HeaderSection({ total, onCreate, onExport }: HeaderSectionProps) {
  return (
    <header className="space-y-3">
      <p className={LINEAR.eyebrow}>WORKSPACE · PROJECTS · {currentPeriodLabel()}</p>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Projects
        </h1>
        <span className="rounded-md border border-[#1a1a1a] bg-[#0e0e0e] px-2 py-0.5 text-[11px] font-medium text-zinc-300">
          {total}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-zinc-300 transition',
              LINEAR.border,
              LINEAR.surfaceElevated,
              'hover:border-zinc-600 hover:text-white',
            )}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            Export
          </button>
        )}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              'bg-emerald-500 text-black hover:bg-emerald-400',
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New project
          </button>
        )}
      </div>
    </header>
  )
}
