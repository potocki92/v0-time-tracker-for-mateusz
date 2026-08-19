'use client'

import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  onExportCsv:  () => void
  onExportJson: () => void
}

export function ReportsExportMenu({ onExportCsv, onExportJson }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Eksportuj raport"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <Download aria-hidden className="size-4" />
          <span className="hidden sm:inline">Eksport</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-44 rounded-xl border-[#1a1a1a] bg-[#0a0a0a] text-zinc-200"
      >
        <DropdownMenuLabel className="text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Pobierz dane
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#1a1a1a]" />
        <DropdownMenuItem onSelect={onExportCsv} className="gap-2">
          <FileSpreadsheet aria-hidden className="size-4 text-emerald-400" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onExportJson} className="gap-2">
          <FileJson aria-hidden className="size-4 text-sky-400" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
