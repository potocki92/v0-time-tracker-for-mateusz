'use client'

import { useEffect } from 'react'
import { DASHBOARD_SECTIONS } from '../sections/registry'
import type { DashboardPeriod, DashboardSectionDef } from '../sections/types'
import { rehydrateDashboardLayout, useDashboardLayout } from '../hooks/use-dashboard-layout'
import { LazySection } from './lazy-section'
import { SectionShell } from './section-shell'
import { CustomizeSheet } from './customize-sheet'

/**
 * Cale zlozenie Pulpitu: hero, pas primary, reszta w zwijanych skorupach.
 *
 * Strona nie wie juz, jakie sekcje istnieja — wie tylko, ze ma je wziac
 * z rejestru i przepuscic przez uklad uzytkownika. Kolejnosc, widocznosc
 * i stan zwiniecia to DANE (`use-dashboard-layout`), nie JSX.
 */
export function DashboardSections({ period }: { period: DashboardPeriod }) {
  const sections = useDashboardLayout((state) => state.sections)
  const toggleCollapsed = useDashboardLayout((state) => state.toggleCollapsed)

  // Zapisany uklad wchodzi PO hydracji — patrz `skipHydration`
  // w use-dashboard-layout.ts.
  useEffect(rehydrateDashboardLayout, [])

  const byId = new Map(DASHBOARD_SECTIONS.map((section) => [section.id, section]))
  const visible = sections
    .filter((state) => state.visible)
    .map((state) => ({ state, def: byId.get(state.id) }))
    .filter((entry): entry is { state: typeof entry.state; def: DashboardSectionDef } =>
      Boolean(entry.def),
    )

  const hero = visible.find((entry) => entry.def.tier === 'hero')
  const primary = visible.filter((entry) => entry.def.tier === 'primary')
  const rest = visible.filter(
    (entry) => entry.def.tier !== 'hero' && entry.def.tier !== 'primary',
  )

  return (
    <>
      <div className="space-y-4">
        {hero && <hero.def.Component period={period} />}

        {/* Pas nad zagieciem: na telefonie jedna kolumna, od lg trzy rowne karty. */}
        {primary.length > 0 && (
          <div data-dashboard-primary className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {primary.map(({ def }) => (
              <div key={def.id} className="min-w-0">
                <def.Component period={period} />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <CustomizeSheet />
        </div>

        <div data-dashboard-rest className="space-y-3">
          {rest.map(({ def, state }) => (
            <SectionShell
              key={def.id}
              id={def.id}
              title={def.title}
              rangeLabel={def.respondsToPeriod ? undefined : def.ownRangeLabel}
              collapsed={state.collapsed}
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
    </>
  )
}
