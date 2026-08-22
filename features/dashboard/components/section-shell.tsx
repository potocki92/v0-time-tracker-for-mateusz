'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  title: string
  /** Wlasny zakres sekcji — pokazywany tylko, gdy sekcja nie idzie za zakladkami. */
  rangeLabel?: string
  collapsed: boolean
  onToggle: (id: string) => void
  /** Akcje sekcji (np. „Otworz") — stoja w naglowku, obok przycisku zwijania. */
  actions?: ReactNode
  children: ReactNode
}

/**
 * Wspolna skorupa sekcji Pulpitu.
 *
 * Sedno jest wydajnosciowe, nie kosmetyczne: przy `collapsed` zawartosc NIE
 * JEST MONTOWANA. Ukrycie CSS-em zostawiloby w drzewie komponent, ktory dalej
 * liczy pochodne, subskrybuje store i rysuje wykres — czyli dokladnie ten koszt,
 * dla ktorego to zwijanie powstalo. Radix odmontowuje zawartosc sam, wiec
 * `children` przekazujemy jako element, a nie przez `forceMount`.
 *
 * Panel dostaje `aria-labelledby` przycisku, a nie wlasny landmark: prawdziwym
 * landmarkiem jest karta w srodku (`<section aria-label>`), wiec drugi
 * region o tej samej nazwie tylko dublowalby sie w czytniku ekranu.
 *
 * Rozwijanie animuje CSS (`.collapsible-reveal` + zmienna Radiksa), a nie
 * framer-motion: LazyMotion kosztowal na tej trasie 17 kB gzip, czyli wiecej,
 * niz caly etap oszczedzil na leniwych sekcjach. Przy `prefers-reduced-motion`
 * klasa w ogole nie leci — animacji wysokosci po prostu nie ma.
 */
export function SectionShell({
  id,
  title,
  rangeLabel,
  collapsed,
  onToggle,
  actions,
  children,
}: Props) {
  // useId zwraca znaki spoza zakresu bezpiecznego dla selektorow (`:` / `«»`),
  // a ten identyfikator trafia do aria-controls i aria-labelledby.
  const triggerId = `section-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-${id}`
  const animated = !usePrefersReducedMotion()

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={() => onToggle(id)}
      data-section-id={id}
    >
      <div className="flex items-center gap-2 px-1">
        <h2 className="min-w-0 flex-1">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              id={triggerId}
              // 44 px to minimalny cel dotykowy — naglowek sekcji jest tu
              // najczesciej klikanym elementem na telefonie.
              className={cn(
                LINEAR.eyebrow,
                'flex min-h-[44px] w-full items-center gap-2 rounded-md text-left transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hairline-strong',
              )}
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform',
                  collapsed && '-rotate-90',
                )}
              />
              <span className="truncate">{title}</span>
            </button>
          </CollapsibleTrigger>
        </h2>

        {rangeLabel && (
          <span className="shrink-0 rounded-md border border-hairline bg-surface-2 px-2 py-0.5 text-2xs text-zinc-400">
            {rangeLabel}
          </span>
        )}

        {actions}
      </div>

      <CollapsibleContent asChild>
        <div
          aria-labelledby={triggerId}
          data-animated={String(animated)}
          className={cn('overflow-hidden', animated && 'collapsible-reveal')}
        >
          <div className="pt-2">{children}</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Odczyt `prefers-reduced-motion` w JS, mimo ze globals.css ma juz bezpiecznik
 * dla animacji CSS: skorupa ma NIE DOKLADAC klasy animacji, a nie liczyc na to,
 * ze ktos ja pozniej wyzeruje. Stan jest tez tym, co widzi test.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    // jsdom nie implementuje matchMedia — bez tej furtki kazdy test renderujacy
    // sekcje wywracalby sie na braku API przegladarki.
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
