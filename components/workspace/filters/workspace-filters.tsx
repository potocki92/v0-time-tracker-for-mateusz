'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, X } from 'lucide-react'
import { LINEAR, SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import {
  WorkspaceOverlay,
  WorkspaceOverlayBody,
  WorkspaceOverlayFooter,
} from '../overlay/workspace-overlay'

type Props = {
  /** Etykieta landmarku sekcji filtrów. */
  sectionLabel: string
  /** Tytuł arkusza mobilnego. */
  title: string
  /** Zdanie pod tytułem arkusza. */
  description?: string
  activeCount: number
  onReset: () => void
  /** Pola filtrów — te same na telefonie i na desktopie. */
  children: ReactNode
  /** Kontrolka obok triggera na telefonie: sortowanie, przełącznik porównania. */
  trailing?: ReactNode
  /** Ta sama kontrolka w stopce wersji inline — zwykle inna geometria. */
  desktopTrailing?: ReactNode
  /**
   * `false`, gdy sekcja ma na desktopie własny toolbar (np. tabela danych)
   * i pola filtrów mają sens wyłącznie w wersji mobilnej.
   */
  inlineOnDesktop?: boolean
  className?: string
}

/**
 * Wspólny pasek filtrów panelu.
 *
 * MOBILE (< md): jedna linia — trigger z licznikiem aktywnych filtrów,
 * slot na kontrolkę pomocniczą i skrót do wyczyszczenia. Pola otwierają się
 * w `WorkspaceOverlay`, czyli tak samo jak każdy inny ekran panelu.
 * DESKTOP (>= md): te same pola inline w karcie, ze stopką reset/pomocnicza.
 *
 * Feature dostarcza WYŁĄCZNIE pola i licznik. Trigger, badge, animacja,
 * overlay, scroll, reset i „zastosuj" są tu raz — wcześniej Raporty miały
 * własny `Sheet`, a Klienci `Collapsible`, więc ten sam gest dawał dwa różne
 * zachowania.
 */
export function WorkspaceFilters({
  sectionLabel,
  title,
  description,
  activeCount,
  onReset,
  children,
  trailing,
  desktopTrailing,
  inlineOnDesktop = true,
  className,
}: Props) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)

  return (
    <section
      aria-label={sectionLabel}
      data-slot="workspace-filters"
      className={cn(SURFACE.card, 'p-3 sm:p-4', className)}
    >
      <div className={cn('flex items-center gap-2', inlineOnDesktop && 'md:hidden')}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium text-zinc-200 transition-colors active:bg-surface-3',
            LINEAR.border,
            LINEAR.surface,
          )}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          {t('filters.open')}
          {activeCount > 0 && (
            <span
              aria-label={t('filters.activeCount', { count: activeCount })}
              className="ml-1 rounded-full bg-white px-1.5 py-0.5 text-2xs font-semibold text-black"
            >
              {activeCount}
            </span>
          )}
        </button>

        {trailing}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
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

      <WorkspaceOverlay
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        size="lg"
      >
        <WorkspaceOverlayBody>{children}</WorkspaceOverlayBody>
        {/* Obie akcje w jednym rzędzie, „zastosuj" dwa razy szersze — pasek
            filtrów jest jedynym overlayem, w którym akcja wtórna (reset) jest
            równie częsta co główna, więc nie schodzi pod nią. */}
        <WorkspaceOverlayFooter className="flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'h-11 flex-1 rounded-xl border text-sm text-zinc-300 active:bg-surface-3 sm:flex-none sm:px-4',
              LINEAR.border,
              LINEAR.surface,
            )}
          >
            {t('filters.reset')}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 flex-[2] rounded-xl bg-white text-sm font-semibold text-black active:opacity-90 sm:flex-none sm:px-6"
          >
            {t('filters.apply')}
          </button>
        </WorkspaceOverlayFooter>
      </WorkspaceOverlay>

      {/* `!open` nie jest optymalizacją: pola niosą `id` powiązane z `<label>`,
          a arkusz otwiera się WYŁĄCZNIE spod triggera `md:hidden`, więc gdy
          jest otwarty, kopia inline i tak jest niewidoczna — zostawiona
          w DOM dublowałaby identyfikatory. */}
      {inlineOnDesktop && !open && (
        <div className="hidden md:block">
          {children}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-4">
            {desktopTrailing ?? <span />}
            <button
              type="button"
              onClick={onReset}
              disabled={activeCount === 0}
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-300 disabled:opacity-40"
            >
              {t('filters.reset')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
