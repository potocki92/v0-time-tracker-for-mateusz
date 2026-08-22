'use client'

import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { SlidersHorizontal, TrendingUp, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Client, Project } from '@/lib/types'
import type { PeriodPreset, ReportsFilters as Filters } from '../lib/types'
import { ReportsFilterForm } from './ReportsFilterForm'

type Props = {
  filters:        Filters
  clients:        Client[]
  projects:       Project[]
  tags:           string[]
  activeCount:    number
  onPresetChange:    (p: PeriodPreset) => void
  onFromChange:      (d: string) => void
  onToChange:        (d: string) => void
  onClientChange:    (id: string) => void
  onProjectChange:   (id: string) => void
  onTagChange:       (tag: string) => void
  onToggleCompare:   () => void
  onReset:           () => void
}

/**
 * Pasek filtrów raportu.
 *
 * Mobile (< md): jedna linia z chip-ami szybkich presetów +
 * trigger Sheet drawer z pełnym formularzem.
 * Desktop (≥ md): pełny formularz inline w karcie.
 */
export function ReportsFilters(props: Props) {
  const [open, setOpen] = useState(false)
  const formProps = {
    filters:         props.filters,
    clients:         props.clients,
    projects:        props.projects,
    tags:            props.tags,
    onPresetChange:  props.onPresetChange,
    onFromChange:    props.onFromChange,
    onToChange:      props.onToChange,
    onClientChange:  props.onClientChange,
    onProjectChange: props.onProjectChange,
    onTagChange:     props.onTagChange,
  }

  return (
    <section
      aria-label="Filtry raportu"
      className={cn(SURFACE.card, 'p-3 sm:p-4')}
    >
      {/* Mobile control bar — desktop ukrywa */}
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium text-zinc-200 transition-colors active:bg-surface-3',
                LINEAR.border,
                LINEAR.surface,
              )}
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              Filtry
              {props.activeCount > 0 && (
                <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-2xs font-semibold text-black">
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
              <SheetTitle className="text-base text-white">Filtry raportu</SheetTitle>
              <SheetDescription className="text-xs text-zinc-400">
                Dopasuj zakres i przekroje danych
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
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-[2] rounded-xl bg-white text-sm font-semibold text-black active:opacity-90"
              >
                Zastosuj
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={props.onToggleCompare}
          aria-pressed={props.filters.compare}
          className={
            'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ' +
            (props.filters.compare
              ? 'border-white/20 bg-white text-black'
              : 'border-hairline bg-surface-2 text-zinc-300 active:bg-surface-3')
          }
        >
          <TrendingUp aria-hidden className="size-4" />
          <span className="sr-only sm:not-sr-only">Porównaj</span>
        </button>

        {props.activeCount > 0 && (
          <button
            type="button"
            onClick={props.onReset}
            aria-label="Wyczyść filtry"
            className={cn(
              'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-zinc-400 active:bg-surface-3',
              LINEAR.border,
              LINEAR.surface,
            )}
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      {/* Desktop inline form */}
      <div className="hidden md:block">
        <ReportsFilterForm {...formProps} />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-4">
          <button
            type="button"
            onClick={props.onToggleCompare}
            aria-pressed={props.filters.compare}
            className={
              'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ' +
              (props.filters.compare
                ? 'border-white/20 bg-white text-black'
                : 'border-hairline bg-surface-2 text-zinc-300 hover:bg-surface-3')
            }
          >
            <TrendingUp aria-hidden className="size-4" />
            Porównaj z poprzednim okresem
          </button>
          <button
            type="button"
            onClick={props.onReset}
            disabled={props.activeCount === 0}
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300 disabled:opacity-40"
          >
            Resetuj filtry
          </button>
        </div>
      </div>
    </section>
  )
}
