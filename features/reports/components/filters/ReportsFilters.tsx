'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, TrendingUp, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import type {
  DateKey,
  ReportClientRef,
  ReportFilters as Filters,
  ReportPeriodPreset,
  ReportProjectRef,
} from '../../domain'
import { ReportsFilterForm } from './ReportsFilterForm'

type Props = {
  filters: Filters
  range: { start: DateKey; end: DateKey }
  clients: ReportClientRef[]
  projects: ReportProjectRef[]
  tags: string[]
  activeCount: number
  onPresetChange: (preset: ReportPeriodPreset) => void
  onCustomRangeChange: (from: DateKey, to: DateKey) => void
  onClientChange: (clientId: string) => void
  onProjectChange: (projectId: string) => void
  onTagChange: (tag: string) => void
  onToggleCompare: () => void
  onReset: () => void
}

/**
 * Pasek filtrow raportu.
 *
 * Mobile (< md): jedna linia — trigger arkusza z pelnym formularzem, przelacznik
 * porownania i czyszczenie. Desktop (>= md): formularz inline w karcie.
 * Uklad zostaje z poprzedniej wersji, bo dzialal; zmienila sie zawartosc.
 */
export function ReportsFilters(props: Props) {
  const t = useTranslations('reports')
  const [open, setOpen] = useState(false)

  const formProps = {
    filters: props.filters,
    range: props.range,
    clients: props.clients,
    projects: props.projects,
    tags: props.tags,
    onPresetChange: props.onPresetChange,
    onCustomRangeChange: props.onCustomRangeChange,
    onClientChange: props.onClientChange,
    onProjectChange: props.onProjectChange,
    onTagChange: props.onTagChange,
  }

  const compareButton = (className: string) => (
    <button
      type="button"
      onClick={props.onToggleCompare}
      aria-pressed={props.filters.compare}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/60',
        props.filters.compare
          ? 'border-white/20 bg-white text-black'
          : 'border-hairline bg-surface-2 text-zinc-300 hover:bg-surface-3',
        className,
      )}
    >
      <TrendingUp aria-hidden className="size-4" />
      <span className="sr-only md:not-sr-only">{t('filters.compare')}</span>
    </button>
  )

  return (
    <section aria-label={t('filters.sectionLabel')} className={cn(SURFACE.card, 'p-3 sm:p-4')}>
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium text-zinc-200 transition-colors active:bg-surface-3',
                LINEAR.border,
                LINEAR.surface,
              )}
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              {t('filters.open')}
              {props.activeCount > 0 && (
                <span
                  aria-label={t('filters.activeCount', { count: props.activeCount })}
                  className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-2xs font-semibold text-black"
                >
                  {props.activeCount}
                </span>
              )}
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="max-h-[88vh] rounded-t-2xl border-hairline bg-surface-1 text-zinc-200"
          >
            <SheetHeader className="border-b border-hairline px-4 py-3">
              <SheetTitle className="text-base text-white">{t('filters.sheetTitle')}</SheetTitle>
              <SheetDescription className="text-xs text-zinc-400">
                {t('filters.sheetDescription')}
              </SheetDescription>
            </SheetHeader>

            <div className="overflow-y-auto px-4 pb-6 pt-4">
              <ReportsFilterForm {...formProps} />
            </div>

            <div className="flex gap-2 border-t border-hairline p-4">
              <button
                type="button"
                onClick={props.onReset}
                className={cn(
                  'h-11 flex-1 rounded-xl border text-sm text-zinc-300 active:bg-surface-3',
                  LINEAR.border,
                  LINEAR.surface,
                )}
              >
                {t('filters.reset')}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-[2] rounded-xl bg-white text-sm font-semibold text-black active:opacity-90"
              >
                {t('filters.apply')}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {compareButton('h-11 w-11 shrink-0 justify-center px-0')}

        {props.activeCount > 0 && (
          <button
            type="button"
            onClick={props.onReset}
            aria-label={t('filters.clear')}
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-zinc-400 active:bg-surface-3',
              LINEAR.border,
              LINEAR.surface,
            )}
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      <div className="hidden md:block">
        <ReportsFilterForm {...formProps} />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-4">
          {compareButton('h-9 px-3 text-sm')}
          <button
            type="button"
            onClick={props.onReset}
            disabled={props.activeCount === 0}
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300 disabled:opacity-40"
          >
            {t('filters.reset')}
          </button>
        </div>
      </div>
    </section>
  )
}
