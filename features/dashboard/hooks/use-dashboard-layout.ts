'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { DASHBOARD_SECTIONS } from '../sections/registry'
import type { DashboardSectionDef, SectionLayoutState } from '../sections/types'

/**
 * Uklad Pulpitu: co jest widoczne, co zwiniete i w jakiej kolejnosci.
 *
 * Kolejnosc jest tu jedynym zrodlem hierarchii: `dashboard-sections.tsx`
 * tnie te liste na karte wiodaca (1), pas nad zagieciem (2-4) i reszte.
 * Zadna sekcja nie jest przypieta — takze karta „Dzisiaj" da sie przesunac
 * nizej albo wylaczyc, jesli ktos woli miec na gorze co innego.
 *
 * Caly ciezar tego pliku siedzi w `mergeLayout`. Zapisany stan i rejestr
 * rozjezdzaja sie przy KAZDYM wydaniu, ktore dodaje albo usuwa sekcje —
 * a uzytkownik ma w localStorage uklad sprzed tego wydania. Bez scalania
 * konczy sie to sekcja-widmem (jest w stanie, nie ma komponentu) albo
 * sekcja niewidzialna (jest w rejestrze, nie ma jej w stanie).
 */
const STORAGE_KEY = 'dashboard-layout'
const VERSION = 1

/** Uklad wprost z rejestru — stan po pierwszym wejsciu i po „Przywroc domyslne". */
export function defaultLayout(
  registry: DashboardSectionDef[] = DASHBOARD_SECTIONS,
): SectionLayoutState[] {
  return registry.map((section, order) => ({
    id: section.id,
    visible: section.defaultVisible,
    collapsed: section.defaultCollapsed,
    order,
  }))
}

/**
 * Scala zapisany uklad z rejestrem. Reguly, w tej kolejnosci:
 *   1. sekcja w rejestrze, brak w zapisie  -> dochodzi z wartosciami domyslnymi,
 *      na koniec listy (nie rozpycha kolejnosci ustawionej przez uzytkownika),
 *   2. sekcja w zapisie, brak w rejestrze  -> wypada,
 *   3. kolejnosc uzytkownika bije kolejnosc rejestru,
 *   4. cos musi zostac widoczne — pusty Pulpit to nie jest ustawienie.
 */
export function mergeLayout(
  saved: SectionLayoutState[] | undefined,
  registry: DashboardSectionDef[] = DASHBOARD_SECTIONS,
): SectionLayoutState[] {
  const defaults = new Map(defaultLayout(registry).map((s) => [s.id, s]))

  const savedInRegistry = (Array.isArray(saved) ? saved : [])
    .filter((s) => s && defaults.has(s.id))
    .sort((a, b) => a.order - b.order)

  const seen = new Set(savedInRegistry.map((s) => s.id))
  const added = defaultLayout(registry).filter((s) => !seen.has(s.id))

  const merged = [...savedInRegistry, ...added].map((state, order) => ({
    id: state.id,
    visible: Boolean(state.visible),
    collapsed: Boolean(state.collapsed),
    order,
  }))

  // Zapis, w ktorym wszystko jest wylaczone, daje pusta strone bez zadnej
  // drogi powrotu poza „Przywroc domyslne" — pierwsza sekcja zostaje wtedy
  // wlaczona z powrotem.
  if (merged.length > 0 && !merged.some((state) => state.visible)) {
    merged[0].visible = true
  }
  return merged
}

/**
 * Wersja 0 to kazdy ksztalt sprzed rejestru — nie da sie go sensownie
 * przetlumaczyc na id sekcji, wiec schodzi do domyslnych. Wersja biezaca
 * i tak przechodzi przez scalanie, bo rejestr mogl sie zmienic miedzy
 * zapisem a odczytem.
 */
export function migrateLayout(
  persisted: unknown,
  version: number,
): { sections: SectionLayoutState[] } {
  if (version < VERSION) return { sections: defaultLayout() }

  const sections = (persisted as { sections?: SectionLayoutState[] } | null)?.sections
  return { sections: mergeLayout(Array.isArray(sections) ? sections : undefined) }
}

interface DashboardLayoutStore {
  sections: SectionLayoutState[]
  toggleCollapsed: (id: string) => void
  toggleVisible: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  resetToDefaults: () => void
}

const renumber = (sections: SectionLayoutState[]) => {
  sections.forEach((section, order) => {
    section.order = order
  })
}

/** Przesuwa sekcje o jedno miejsce; poza zakresem to no-op, nie wyjatek. */
const move = (sections: SectionLayoutState[], id: string, delta: number) => {
  const from = sections.findIndex((s) => s.id === id)
  const to = from + delta
  if (from === -1 || to < 0 || to >= sections.length) return
  const [moved] = sections.splice(from, 1)
  sections.splice(to, 0, moved)
  renumber(sections)
}

export const useDashboardLayout = create<DashboardLayoutStore>()(
  persist(
    immer((set) => ({
      sections: defaultLayout(),

      toggleCollapsed: (id) =>
        set((state) => {
          const section = state.sections.find((s) => s.id === id)
          if (section) section.collapsed = !section.collapsed
        }),

      toggleVisible: (id) =>
        set((state) => {
          const section = state.sections.find((s) => s.id === id)
          if (!section) return
          // Ostatniej widocznej sekcji nie da sie wylaczyc: pusty Pulpit
          // nie jest ustawieniem, tylko slepa uliczka.
          if (section.visible && state.sections.filter((s) => s.visible).length === 1) return
          section.visible = !section.visible
        }),

      moveUp: (id) => set((state) => move(state.sections, id, -1)),
      moveDown: (id) => set((state) => move(state.sections, id, 1)),

      resetToDefaults: () => set({ sections: defaultLayout() }),
    })),
    {
      name: STORAGE_KEY,
      version: VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sections: state.sections }),
      migrate: migrateLayout,
      /**
       * Odczyt z localStorage czeka na `rehydrateDashboardLayout()`.
       *
       * Bez tego zustand czytalby storage juz przy imporcie modulu, wiec
       * PIERWSZY render klienta mialby inny zestaw zamontowanych sekcji niz
       * HTML z serwera (serwer nie widzi localStorage) — czyli blad hydracji
       * na kazdym Pulpicie, na ktorym ktos cokolwiek zwinal.
       */
      skipHydration: true,
      // Rejestr mogl sie zmienic od czasu zapisu — scalamy takze wtedy,
      // gdy wersja sie zgadza i `migrate` w ogole nie wystartowal.
      merge: (persisted, current) => {
        const saved = (persisted as { sections?: SectionLayoutState[] } | null)?.sections
        // Brak zapisu = nie ma czego scalac. Bez tej furtki `mergeLayout`
        // zwrocilby domyslny uklad i skasowal stan ustawiony przed hydracja.
        if (!Array.isArray(saved)) return current
        return { ...current, sections: mergeLayout(saved) }
      },
    },
  ),
)

/**
 * Wciaga zapisany uklad po zamontowaniu Pulpitu. Wolane raz, z efektu —
 * dopiero wtedy klient ma prawo rozniac sie od HTML-a z serwera.
 */
export function rehydrateDashboardLayout(): void {
  void useDashboardLayout.persist.rehydrate()
}
