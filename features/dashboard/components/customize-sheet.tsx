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
 * „Dostosuj pulpit" — arkusz od dolu z lista sekcji.
 *
 * Zmiana kolejnosci idzie przyciskami gora/dol, nie przeciaganiem: drag and
 * drop na telefonie wymaga biblioteki i i tak potrzebuje alternatywy
 * klawiaturowej, a dwa przyciski sa ta alternatywa od razu.
 *
 * Hero nie ma tu ani przelacznika, ani strzalek — stoi nad zagieciem
 * z definicji, wiec te kontrolki nie mialyby czego zmienic.
 */
export function CustomizeSheet() {
  const sections = useDashboardLayout((state) => state.sections)
  const toggleVisible = useDashboardLayout((state) => state.toggleVisible)
  const moveUp = useDashboardLayout((state) => state.moveUp)
  const moveDown = useDashboardLayout((state) => state.moveDown)
  const resetToDefaults = useDashboardLayout((state) => state.resetToDefaults)

  const byId = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]))
  const movable = sections.filter((state) => byId.get(state.id)?.tier !== 'hero')

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
            Wyłączona sekcja znika z Pulpitu, ale zostaje na tej liście — nic nie
            jest kasowane.
          </SheetDescription>
        </SheetHeader>

        <ul role="list" className="divide-y divide-hairline px-4">
          {movable.map((state, index) => {
            const section = byId.get(state.id)
            if (!section) return null

            return (
              <li
                key={state.id}
                data-section-id={state.id}
                className="flex items-center gap-3 py-2"
              >
                <Switch
                  id={`toggle-${state.id}`}
                  checked={state.visible}
                  onCheckedChange={() => toggleVisible(state.id)}
                />
                <label
                  htmlFor={`toggle-${state.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-zinc-200"
                >
                  {section.title}
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
                  disabled={index === movable.length - 1}
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
