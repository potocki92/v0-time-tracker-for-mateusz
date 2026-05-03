'use client'

import { BarChart3 } from 'lucide-react'
import { ReportsExportMenu } from './ReportsExportMenu'

type Props = {
  rangeLabel: string
  onExportCsv:  () => void
  onExportJson: () => void
}

export function ReportsHeader({ rangeLabel, onExportCsv, onExportJson }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Insights
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-white sm:text-2xl">
          <BarChart3 aria-hidden className="size-5 text-zinc-400 sm:size-6" />
          Raporty
        </h1>
        <p className="mt-1 truncate text-xs text-zinc-500 sm:text-sm">{rangeLabel}</p>
      </div>

      <ReportsExportMenu onExportCsv={onExportCsv} onExportJson={onExportJson} />
    </header>
  )
}
