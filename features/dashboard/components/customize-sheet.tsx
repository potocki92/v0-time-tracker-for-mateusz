'use client'

import { ArrowDown, ArrowUp, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { DASHBOARD_SECTIONS } from '../sections/registry'
import { useDashboardLayout } from '../hooks/use-dashboard-layout'

/**
 * „Dostosuj pulpit" — arkusz od dolu z lista sekcji w kolejnosci Pulpitu.
 *
 * Kolejnosc jest tu wszystkim: pierwsza widoczna sekcja jest karta wiodaca,
 * kolejne trzy tworza pas nad zagieciem, reszta schodzi do zwijanej listy.
 * Dlatego lista pokazuje wprost, gdzie przebiega zagiecie — bez tego strzalki
 * wygladaja jak przestawianie w obrebie jednego worka.
 *
 * Zmiana kolejnosci idzie przyciskami gora/dol, nie przeciaganiem: drag and
 * drop na telefonie wymaga biblioteki i i tak potrzebuje alternatywy
 * klawiaturowej, a dwa przyciski sa ta alternatywa od razu.
 */
const ABOVE_THE_FOLD = 4

export function CustomizeSheet() {
  const sections = useDashboardLayout((state) => state.sections)
  const toggleVisible = useDashboardLayout((state) => state.toggleVisible)
  const moveUp = useDashboardLayout((state) => state.moveUp)
  const moveDown = useDashboardLayout((state) => state.moveDown)
  const resetToDefaults = useDashboardLayout((state) => state.resetToDefaults)

  const byId = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]))
  const visibleCount = sections.filter((state) => state.visible).length
  // Numer pozycji liczymy po WIDOCZNYCH sekcjach — to one wypelniaja sloty
  // nad zagieciem. Ukryta sekcja nie zajmuje slotu, wiec go nie numeruje.
  let visibleIndex = -1

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-[44px] text-zinc-400">
          <Settings2 className="size-3.5" aria-hidden />
          Dostosuj pulpit
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[80svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dostosuj pulpit</SheetTitle>
          <SheetDescription>
            Pierwsza sekcja jest kartą wiodącą, kolejne trzy stoją nad zagięciem.
            Reszta czeka zwinięta. Wyłączona sekcja znika z Pulpitu, ale zostaje
            na tej liście — nic nie jest kasowane.
          </SheetDescription>
        </SheetHeader>

        <ul role="list" className="px-4">
          {sections.map((state, index) => {
            const section = byId.get(state.id)
            if (!section) return null
            if (state.visible) visibleIndex += 1

            const aboveTheFold = state.visible && visibleIndex < ABOVE_THE_FOLD
            const isLastVisible = state.visible && visibleCount === 1
            const foldEndsHere = aboveTheFold && visibleIndex === ABOVE_THE_FOLD - 1

            return (
              <li
                key={state.id}
                data-section-id={state.id}
                data-above-the-fold={aboveTheFold}
                className={
                  foldEndsHere
                    ? 'flex items-center gap-3 border-b-2 border-dashed border-hairline-strong py-2'
                    : 'flex items-center gap-3 border-b border-hairline py-2'
                }
              >
                <Switch
                  id={`toggle-${state.id}`}
                  checked={state.visible}
                  disabled={isLastVisible}
                  onCheckedChange={() => toggleVisible(state.id)}
                />
                <label
                  htmlFor={`toggle-${state.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-zinc-200"
                >
                  {section.title}
                  {aboveTheFold && (
                    <span className="ml-2 text-2xs uppercase tracking-wide text-zinc-500">
                      {visibleIndex === 0 ? 'karta wiodąca' : 'nad zagięciem'}
                    </span>
                  )}
                </label>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Przenieś „${section.title}" wyżej`}
                  disabled={index === 0}
                  onClick={() => moveUp(state.id)}
                >
                  <ArrowUp className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`Przenieś „${section.title}" niżej`}
                  disabled={index === sections.length - 1}
                  onClick={() => moveDown(state.id)}
                >
                  <ArrowDown className="size-4" aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>

        <div className="px-4 pb-4">
          <Button variant="outline" className="min-h-[44px] w-full" onClick={resetToDefaults}>
            Przywróć domyślne
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
