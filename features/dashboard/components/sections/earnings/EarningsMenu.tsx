'use client'

import { memo } from 'react'
import {
  BarChart3,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  GitCompareArrows,
  MoreHorizontal,
  Target,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EarningsMenuProps {
  privacyMode: boolean
  compareMode: boolean
  onTogglePrivacy: () => void
  onToggleCompare: () => void
  onExportCsv: () => void
  onExportPdf: () => void
  onOpenAnalytics: () => void
  onSetGoal: () => void
  onCopyAmount: () => void
  isExporting?: boolean
}

const ITEM_BASE =
  'cursor-pointer gap-2.5 rounded-md px-2 py-2 text-xs text-zinc-200 focus:bg-[#161616] focus:text-white data-[state=checked]:text-white'

export const EarningsMenu = memo(function EarningsMenu({
  privacyMode,
  compareMode,
  onTogglePrivacy,
  onToggleCompare,
  onExportCsv,
  onExportPdf,
  onOpenAnalytics,
  onSetGoal,
  onCopyAmount,
  isExporting = false,
}: EarningsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Opcje karty Zarobki"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-zinc-400 transition hover:border-[#262626] hover:bg-[#141414] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 data-[state=open]:border-emerald-500/40 data-[state=open]:bg-[#0e120e] data-[state=open]:text-emerald-400"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[260px] rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-1.5 text-zinc-200 shadow-2xl"
      >
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Karta Zarobki
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={isExporting}
              className="cursor-pointer gap-2.5 rounded-md px-2 py-2 text-xs text-zinc-200 focus:bg-[#161616] focus:text-white data-[state=open]:bg-[#161616] data-[state=open]:text-white"
            >
              <Download className="size-4 text-emerald-400" aria-hidden />
              <span className="flex-1">
                {isExporting ? 'Generuję raport…' : 'Eksportuj raport'}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={4}
              className="min-w-[180px] rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-1.5 text-zinc-200 shadow-2xl"
            >
              <DropdownMenuItem onClick={onExportPdf} disabled={isExporting} className={ITEM_BASE}>
                <FileText className="size-4 text-rose-400" aria-hidden />
                <span>PDF</span>
                <DropdownMenuShortcut className="text-zinc-500">⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv} disabled={isExporting} className={ITEM_BASE}>
                <FileSpreadsheet className="size-4 text-emerald-400" aria-hidden />
                <span>CSV</span>
                <DropdownMenuShortcut className="text-zinc-500">⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={onOpenAnalytics} className={ITEM_BASE}>
            <BarChart3 className="size-4 text-emerald-400" aria-hidden />
            <span>Szczegółowa analityka</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onCopyAmount} className={ITEM_BASE}>
            <Copy className="size-4 text-zinc-400" aria-hidden />
            <span>Skopiuj kwotę okresu</span>
            <DropdownMenuShortcut className="text-zinc-500">⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-[#1a1a1a]" />

        <DropdownMenuLabel className="px-2 pb-1 pt-1 text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Analiza
        </DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={compareMode}
          onCheckedChange={onToggleCompare}
          className="cursor-pointer gap-2.5 rounded-md py-2 text-xs text-zinc-200 focus:bg-[#161616] focus:text-white"
        >
          <span className="flex flex-1 items-center gap-2.5 pl-1">
            <GitCompareArrows className="size-4 text-emerald-400" aria-hidden />
            <span>Porównaj z poprzednim okresem</span>
          </span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuItem onClick={onSetGoal} className={ITEM_BASE}>
          <Target className="size-4 text-emerald-400" aria-hidden />
          <span>Ustaw cel finansowy</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-[#1a1a1a]" />

        <DropdownMenuCheckboxItem
          checked={privacyMode}
          onCheckedChange={onTogglePrivacy}
          className="cursor-pointer gap-2.5 rounded-md py-2 text-xs text-zinc-200 focus:bg-[#161616] focus:text-white"
        >
          <span className="flex flex-1 items-center gap-2.5 pl-1">
            {privacyMode ? (
              <Eye className="size-4 text-emerald-400" aria-hidden />
            ) : (
              <EyeOff className="size-4 text-zinc-400" aria-hidden />
            )}
            <span>{privacyMode ? 'Pokaż kwoty' : 'Ukryj kwoty (Privacy mode)'}</span>
          </span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
