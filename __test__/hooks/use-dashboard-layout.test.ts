import { beforeEach, describe, expect, it } from 'vitest'
import {
  defaultLayout,
  mergeLayout,
  migrateLayout,
  useDashboardLayout,
} from '@/features/dashboard/hooks/use-dashboard-layout'
import { DASHBOARD_SECTIONS } from '@/features/dashboard/sections/registry'
import type { DashboardSectionDef, SectionLayoutState } from '@/features/dashboard/sections/types'

/**
 * Scalanie zapisanego ukladu z rejestrem to klasyczne zrodlo bugow w persist:
 * uzytkownik ma w localStorage stan sprzed wydania, w ktorym byly inne sekcje.
 * Kazdy przypadek z tego pliku wydarzyl sie juz komus w produkcji.
 */

const def = (
  id: string,
  overrides: Partial<DashboardSectionDef> = {},
): DashboardSectionDef => ({
  id,
  title: id,
  tier: 'secondary',
  respondsToPeriod: false,
  ownRangeLabel: 'zakres',
  loading: 'lazy',
  defaultVisible: true,
  defaultCollapsed: true,
  Component: () => null,
  ...overrides,
})

const REGISTRY: DashboardSectionDef[] = [
  def('hero', { tier: 'hero', loading: 'eager', defaultCollapsed: false }),
  def('alfa'),
  def('beta'),
]

const saved = (...ids: string[]): SectionLayoutState[] =>
  ids.map((id, order) => ({ id, visible: true, collapsed: false, order }))

const heroId = DASHBOARD_SECTIONS.find((s) => s.tier === 'hero')!.id

beforeEach(() => {
  localStorage.clear()
  useDashboardLayout.getState().resetToDefaults()
})

describe('use-dashboard-layout — scalanie z rejestrem', () => {
  it('usuwa sekcje, ktorej nie ma juz w rejestrze', () => {
    const merged = mergeLayout(saved('hero', 'alfa', 'zombie', 'beta'), REGISTRY)
    expect(merged.map((s) => s.id)).toEqual(['hero', 'alfa', 'beta'])
  })

  it('dodaje nowa sekcje z domyslnymi wartosciami, nie ruszajac kolejnosci uzytkownika', () => {
    // Uzytkownik przestawil beta przed alfa; „beta" i „alfa" istnialy,
    // „hero" doszlo w nowym wydaniu.
    const merged = mergeLayout(saved('beta', 'alfa'), REGISTRY)

    expect(merged.map((s) => s.id), 'kolejnosc uzytkownika ma pierwszenstwo').toEqual([
      'beta',
      'alfa',
      'hero',
    ])
    const fresh = merged.find((s) => s.id === 'hero')!
    expect(fresh.visible).toBe(true)
    expect(fresh.collapsed).toBe(false)
  })

  it('numeruje kolejnosc bez dziur', () => {
    const merged = mergeLayout(saved('beta', 'zombie', 'alfa'), REGISTRY)
    expect(merged.map((s) => s.order)).toEqual([0, 1, 2])
  })

  it('respektuje zapisane ukrycie karty wiodacej', () => {
    // Zadna sekcja nie jest przypieta — o tym, co stoi na gorze, decyduje
    // wylacznie kolejnosc uzytkownika.
    const merged = mergeLayout(
      [
        { id: 'hero', visible: false, collapsed: true, order: 0 },
        { id: 'alfa', visible: true, collapsed: false, order: 1 },
      ],
      REGISTRY,
    )
    expect(merged.find((s) => s.id === 'hero')!.visible).toBe(false)
  })

  it('zapis, w ktorym wszystko jest wylaczone, wraca z jedna widoczna sekcja', () => {
    const merged = mergeLayout(
      [
        { id: 'hero', visible: false, collapsed: false, order: 0 },
        { id: 'alfa', visible: false, collapsed: false, order: 1 },
        { id: 'beta', visible: false, collapsed: false, order: 2 },
      ],
      REGISTRY,
    )
    expect(
      merged.filter((s) => s.visible).map((s) => s.id),
      'pusty Pulpit nie ma zadnej drogi powrotu poza „Przywroc domyslne"',
    ).toEqual(['hero'])
  })
})

describe('use-dashboard-layout — akcje', () => {
  it('moveUp na pierwszej sekcji jest bez efektu, nie rzuca', () => {
    const before = useDashboardLayout.getState().sections.map((s) => s.id)
    expect(() => useDashboardLayout.getState().moveUp(before[0])).not.toThrow()
    expect(useDashboardLayout.getState().sections.map((s) => s.id)).toEqual(before)
  })

  it('moveDown na ostatniej sekcji jest bez efektu, nie rzuca', () => {
    const before = useDashboardLayout.getState().sections.map((s) => s.id)
    expect(() => useDashboardLayout.getState().moveDown(before.at(-1)!)).not.toThrow()
    expect(useDashboardLayout.getState().sections.map((s) => s.id)).toEqual(before)
  })

  it('moveDown przesuwa sekcje o jedno miejsce w dol', () => {
    const [, second, third] = useDashboardLayout.getState().sections.map((s) => s.id)
    useDashboardLayout.getState().moveDown(second)
    const after = useDashboardLayout.getState().sections.map((s) => s.id)
    expect(after.indexOf(second)).toBe(after.indexOf(third) + 1)
  })

  it('nieznane id nie rzuca', () => {
    expect(() => useDashboardLayout.getState().moveUp('nie-ma-takiej')).not.toThrow()
    expect(() => useDashboardLayout.getState().toggleVisible('nie-ma-takiej')).not.toThrow()
  })

  it('karte wiodaca da sie wylaczyc i przesunac jak kazda inna', () => {
    useDashboardLayout.getState().toggleVisible(heroId)
    expect(
      useDashboardLayout.getState().sections.find((s) => s.id === heroId)!.visible,
      'skoro o gorze decyduje kolejnosc, to hero tez musi dac sie ustapic',
    ).toBe(false)

    useDashboardLayout.getState().toggleVisible(heroId)
    useDashboardLayout.getState().moveDown(heroId)
    expect(useDashboardLayout.getState().sections[0].id).not.toBe(heroId)
  })

  it('sekcja z dolu listy da sie doprowadzic nad zagiecie', () => {
    const last = useDashboardLayout.getState().sections.at(-1)!.id
    for (let i = 0; i < DASHBOARD_SECTIONS.length; i += 1) {
      useDashboardLayout.getState().moveUp(last)
    }
    expect(
      useDashboardLayout.getState().sections[0].id,
      'bez tego strzalki w „Dostosuj pulpit" nie zmieniaja tego, co widac bez przewijania',
    ).toBe(last)
  })

  it('toggleCollapsed przelacza zwykla sekcje w obie strony', () => {
    const target = useDashboardLayout
      .getState()
      .sections.find((s) => s.id !== heroId)!
    const before = target.collapsed
    useDashboardLayout.getState().toggleCollapsed(target.id)
    expect(
      useDashboardLayout.getState().sections.find((s) => s.id === target.id)!.collapsed,
    ).toBe(!before)
  })

  it('ostatniej widocznej sekcji nie da sie wylaczyc', () => {
    for (const section of useDashboardLayout.getState().sections) {
      useDashboardLayout.getState().toggleVisible(section.id)
    }
    const visible = useDashboardLayout.getState().sections.filter((s) => s.visible)
    expect(visible.length, 'Pulpit nie moze zostac pusty').toBe(1)
  })

  it('resetToDefaults odtwarza stan z rejestru', () => {
    const store = useDashboardLayout.getState()
    store.moveDown(store.sections[1].id)
    store.toggleVisible(store.sections[2].id)
    store.resetToDefaults()
    expect(useDashboardLayout.getState().sections).toEqual(defaultLayout())
  })

  it('domyslny uklad odwzorowuje rejestr 1:1', () => {
    expect(defaultLayout().map((s) => s.id)).toEqual(DASHBOARD_SECTIONS.map((s) => s.id))
    for (const section of DASHBOARD_SECTIONS) {
      const state = defaultLayout().find((s) => s.id === section.id)!
      expect(state.visible).toBe(section.defaultVisible)
      expect(state.collapsed).toBe(section.defaultCollapsed)
    }
  })
})

describe('use-dashboard-layout — migracja', () => {
  it('stan zapisany w wersji 0 przechodzi przez migrate bez wyjatku', () => {
    // Ksztalt sprzed rejestru: mapa id -> boolean (zwiniete?), bez kolejnosci.
    const legacy = { collapsed: { earnings: true }, hidden: ['invoices'] }
    expect(() => migrateLayout(legacy, 0)).not.toThrow()
    expect(migrateLayout(legacy, 0).sections).toEqual(defaultLayout())
  })

  it('smieci w storage nie wywracaja Pulpitu', () => {
    for (const junk of [null, undefined, 42, 'string', { sections: 'nie-tablica' }]) {
      expect(() => migrateLayout(junk, 1)).not.toThrow()
      expect(migrateLayout(junk, 1).sections).toEqual(defaultLayout())
    }
  })

  it('stan w biezacej wersji zostaje przepuszczony przez scalanie', () => {
    const persisted = { sections: saved(...DASHBOARD_SECTIONS.map((s) => s.id).reverse()) }
    const migrated = migrateLayout(persisted, 1)
    expect(migrated.sections).toEqual(mergeLayout(persisted.sections))
  })
})

describe('use-dashboard-layout — hydracja', () => {
  it('nie czyta storage przed zamontowaniem Pulpitu', () => {
    // Odczyt przy imporcie modulu dalby inny pierwszy render klienta niz HTML
    // z serwera — blad hydracji na kazdym Pulpicie ze zwinieta sekcja.
    expect(useDashboardLayout.persist.getOptions().skipHydration).toBe(true)
  })

  it('hydracja bez zapisu nie kasuje biezacego stanu', () => {
    const merge = useDashboardLayout.persist.getOptions().merge!
    const current = useDashboardLayout.getState()
    expect(merge(undefined, current)).toBe(current)
    expect(merge({ sections: 'nie-tablica' }, current)).toBe(current)
  })

  it('hydracja z zapisem scala go z rejestrem', () => {
    const merge = useDashboardLayout.persist.getOptions().merge!
    const current = useDashboardLayout.getState()
    const saved = saved_state()
    const merged = merge({ sections: saved }, current) as { sections: SectionLayoutState[] }
    expect(merged.sections).toEqual(mergeLayout(saved))
  })
})

function saved_state(): SectionLayoutState[] {
  return DASHBOARD_SECTIONS.map((section, order) => ({
    id: section.id,
    visible: true,
    collapsed: false,
    order: DASHBOARD_SECTIONS.length - order,
  }))
}
