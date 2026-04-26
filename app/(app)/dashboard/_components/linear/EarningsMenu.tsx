'use client'

import { memo } from 'react'
import {
  BarChart3,
  Copy,
  Download,
  EyeOff,
  Eye,
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

/**
 * Menu kontekstowe karty Zarobki. Cała logika dropdownu (focus, klawiatura,
 * portal, animacje) jest dostarczana przez Radix — komponent skupia się na
 * doborze ikon i kolejności akcji.
 */
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
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition hover:border-border hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:border-primary/40 data-[state=open]:bg-accent data-[state=open]:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[260px] rounded-xl border-border/70 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Karta Zarobki
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={isExporting}
              className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px] focus:bg-accent"
            >
              <Download className="size-4 text-primary" aria-hidden />
              <span className="flex-1">Eksportuj raport</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={4}
              className="min-w-[180px] rounded-xl border-border/70 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md"
            >
              <DropdownMenuItem
                onClick={onExportPdf}
                disabled={isExporting}
                className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
              >
                <FileText className="size-4 text-rose-400" aria-hidden />
                <span>PDF</span>
                <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportCsv}
                disabled={isExporting}
                className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
              >
                <FileSpreadsheet className="size-4 text-emerald-400" aria-hidden />
                <span>CSV</span>
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={onOpenAnalytics}
            className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
          >
            <BarChart3 className="size-4 text-primary" aria-hidden />
            <span>Szczegółowa analityka</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onCopyAmount}
            className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
          >
            <Copy className="size-4 text-muted-foreground" aria-hidden />
            <span>Skopiuj kwotę okresu</span>
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuLabel className="px-2 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Analiza
        </DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={compareMode}
          onCheckedChange={onToggleCompare}
          className="cursor-pointer gap-2.5 rounded-lg py-2 text-[13px]"
        >
          <span className="flex flex-1 items-center gap-2.5 pl-1">
            <GitCompareArrows className="size-4 text-primary" aria-hidden />
            <span>Porównaj z poprzednim okresem</span>
          </span>
        </DropdownMenuCheckboxItem>

        <DropdownMenuItem
          onClick={onSetGoal}
          className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-[13px]"
        >
          <Target className="size-4 text-primary" aria-hidden />
          <span>Ustaw cel finansowy</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuCheckboxItem
          checked={privacyMode}
          onCheckedChange={onTogglePrivacy}
          className="cursor-pointer gap-2.5 rounded-lg py-2 text-[13px]"
        >
          <span className="flex flex-1 items-center gap-2.5 pl-1">
            {privacyMode ? (
              <Eye className="size-4 text-primary" aria-hidden />
            ) : (
              <EyeOff className="size-4 text-muted-foreground" aria-hidden />
            )}
            <span>{privacyMode ? 'Pokaż kwoty' : 'Ukryj kwoty (Privacy mode)'}</span>
          </span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
