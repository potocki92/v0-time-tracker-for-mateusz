'use client'

import { useEffect } from 'react'
import { DASHBOARD_SECTIONS } from '../sections/registry'
import type { DashboardPeriod, DashboardSectionDef } from '../sections/types'
import { rehydrateDashboardLayout, useDashboardLayout } from '../hooks/use-dashboard-layout'
import { LazySection } from './lazy-section'
import { RangeBadge, SectionShell } from './section-shell'
import { LINEAR } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'
import { CustomizeSheet } from './customize-sheet'

/**
 * Cale zlozenie Pulpitu.
 *
 * O tym, jak sekcja wyglada, decyduje jej POZYCJA w ukladzie uzytkownika,
 * a nie `tier` z rejestru:
 *
 *   pozycja 1     karta wiodaca — pelna szerokosc, zawsze rozwinieta
 *   pozycje 2..4  pas nad zagieciem — trzy karty w rzedzie od lg
 *   reszta        zwijane skorupy, montowane leniwie
 *
 * Dzieki temu „Dostosuj pulpit" naprawde zmienia to, co widac bez
 * przewijania: przesuniecie sekcji na gore wprowadza ja nad zagiecie,
 * a sekcja z niej wypchnieta schodzi do listy zwinietych. `tier` z rejestru
 * jest juz tylko wartoscia POCZATKOWA tej kolejnosci.
 *
 * Budzet nad zagieciem (1 + 3) jest tu wymuszony strukturalnie — nie da sie
 * go przekroczyc ustawieniami, bo wynika z ciecia listy.
 */
const LEAD_SLOTS = 1
const BAND_SLOTS = 3

type VisibleSection = {
  def: DashboardSectionDef
  collapsed: boolean
}

export function DashboardSections({ period }: { period: DashboardPeriod }) {
  const sections = useDashboardLayout((state) => state.sections)
  const toggleCollapsed = useDashboardLayout((state) => state.toggleCollapsed)

  // Zapisany uklad wchodzi PO hydracji — patrz `skipHydration`
  // w use-dashboard-layout.ts.
  useEffect(rehydrateDashboardLayout, [])

  const byId = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]))
  const visible = sections
    .filter((state) => state.visible)
    .map((state) => ({ def: byId.get(state.id), collapsed: state.collapsed }))
    .filter((entry): entry is VisibleSection => Boolean(entry.def))

  const [lead] = visible.slice(0, LEAD_SLOTS)
  const band = visible.slice(LEAD_SLOTS, LEAD_SLOTS + BAND_SLOTS)
  const rest = visible.slice(LEAD_SLOTS + BAND_SLOTS)

  return (
    <div className="space-y-4">
      {lead && <PinnedSection section={lead} period={period} />}

      {band.length > 0 && (
        <div data-dashboard-primary className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {band.map((section) => (
            <PinnedSection key={section.def.id} section={section} period={period} />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <CustomizeSheet />
      </div>

      <div data-dashboard-rest className="space-y-3">
        {rest.map(({ def, collapsed }) => (
          <SectionShell
            key={def.id}
            id={def.id}
            title={def.title}
            rangeLabel={rangeLabelOf(def)}
            collapsed={collapsed}
            onToggle={toggleCollapsed}
          >
            {def.loading === 'lazy' ? (
              <LazySection>
                <def.Component period={period} />
              </LazySection>
            ) : (
              <def.Component period={period} />
            )}
          </SectionShell>
        ))}
      </div>
    </div>
  )
}

/**
 * Sekcja nad zagieciem: ten sam naglowek co w skorupie, ale bez zwijania.
 * Zwiniecie karty, ktora uzytkownik SAM postawil na gorze, byloby
 * przelacznikiem na nic — od chowania jest lista nizej.
 *
 * Zawartosc montuje sie od razu, takze gdy rejestr oznaczyl sekcje jako
 * `lazy`: skoro stoi nad zagieciem, to i tak jest w kadrze. Kod nadal
 * przychodzi osobnym chunkiem (`next/dynamic`).
 */
function PinnedSection({
  section: { def },
  period,
}: {
  section: VisibleSection
  period: DashboardPeriod
}) {
  return (
    <div data-section-id={def.id} className="min-w-0">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className={cn(LINEAR.eyebrow, 'min-w-0 flex-1 truncate')}>
          {def.title}
        </h2>
        <RangeBadge label={rangeLabelOf(def)} />
      </div>
      <def.Component period={period} />
    </div>
  )
}

/** Wlasny zakres pokazujemy tylko wtedy, gdy sekcja nie idzie za zakladkami. */
function rangeLabelOf(def: DashboardSectionDef): string | undefined {
  return def.respondsToPeriod ? undefined : def.ownRangeLabel
}
