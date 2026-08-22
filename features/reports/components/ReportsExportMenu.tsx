'use client'

import { Button } from '@/components/ui/button'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
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
        <Button
          variant="outline"
          size="sm"
          aria-label="Eksportuj raport"
          className={cn('rounded-xl text-zinc-200', LINEAR.border, LINEAR.surface, LINEAR.surfaceHover)}
        >
          <Download aria-hidden className="size-4" />
          <span className="hidden sm:inline">Eksport</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn('w-44 rounded-xl text-zinc-200', LINEAR.border, LINEAR.surface)}
      >
        <DropdownMenuLabel className={LINEAR.eyebrow}>Pobierz dane</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-hairline" />
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
