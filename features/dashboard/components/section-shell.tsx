'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { DashboardRangeBadge, DashboardSectionChromeProvider } from '@/components/workspace/card/dashboard-section-card'

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
 * Wiersz sekcji w panelu sekcji zwinietych.
 *
 * Sedno jest wydajnosciowe, nie kosmetyczne: przy `collapsed` zawartosc NIE
 * JEST MONTOWANA. Ukrycie CSS-em zostawiloby w drzewie komponent, ktory dalej
 * liczy pochodne, subskrybuje store i rysuje wykres — czyli dokladnie ten koszt,
 * dla ktorego to zwijanie powstalo. Radix odmontowuje zawartosc sam, wiec
 * `children` przekazujemy jako element, a nie przez `forceMount`.
 *
 * Skorupa nie ma wlasnej ramki ani promienia: wlos miedzy wierszami rysuje
 * `divide-y` PANELU w `dashboard-sections.tsx`, wiec kilkanascie sekcji sklada
 * sie w jedna powierzchnie zamiast w kilkanascie luznych naglowkow na czarnym
 * tle. Zaden wiersz nie chowa wlasnego obramowania selektorem pozycyjnym —
 * obramowania po prostu nie ma.
 *
 * Rozwinieta sekcja dostaje chrome `inline`: tytul i zakres niesie juz ten
 * wiersz, wiec karta w srodku nie rysuje drugiego naglowka ani drugiej ramki.
 * Landmark `<section aria-label>` zostaje w karcie — panel dostaje tylko
 * `aria-labelledby` przycisku, bo drugi region o tej samej nazwie dublowalby
 * sie w czytniku ekranu.
 *
 * Rozwijanie animuje CSS (`.collapsible-reveal` + zmienna Radiksa), a nie
 * Motion: LazyMotion kosztowal na tej trasie 17 kB gzip, czyli wiecej,
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
      <div className="flex items-center gap-2 pr-4">
        <h2 className="min-w-0 flex-1">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              id={triggerId}
              // 44 px to minimalny cel dotykowy — naglowek sekcji jest tu
              // najczesciej klikanym elementem na telefonie.
              className={cn(
                'flex min-h-[44px] w-full items-center gap-2.5 px-4 text-left text-sm font-medium text-zinc-200 transition',
                'hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hairline-strong',
              )}
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4 shrink-0 text-zinc-500 transition-transform duration-150',
                  collapsed && '-rotate-90',
                )}
              />
              <span className="truncate">{title}</span>
            </button>
          </CollapsibleTrigger>
        </h2>

        <DashboardRangeBadge label={rangeLabel} />

        {actions}
      </div>

      <CollapsibleContent asChild>
        <div
          aria-labelledby={triggerId}
          data-animated={String(animated)}
          className={cn('overflow-hidden', animated && 'collapsible-reveal')}
        >
          <div className="px-4 pb-4 pt-1">
            <DashboardSectionChromeProvider
              value={{ title, rangeLabel, variant: 'inline' }}
            >
              {children}
            </DashboardSectionChromeProvider>
          </div>
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
