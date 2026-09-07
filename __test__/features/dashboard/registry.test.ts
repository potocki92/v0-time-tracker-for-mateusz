import { describe, expect, it } from 'vitest'
import { DASHBOARD_SECTIONS } from '@/features/dashboard/sections/registry'

/**
 * Rejestr jest JEDYNYM zrodlem prawdy o tym, co stoi na Pulpicie.
 * Ten plik pilnuje kontraktu, ktorego nie widac w typach: budzetu nad
 * zagieciem, kompletnosci po refaktorze i tego, ze uzytkownik zawsze wie,
 * jaki okres oglada.
 */

/**
 * Inwentaryzacja Pulpitu sprzed refaktoru (22.08.2026) — 14 pozycji.
 * Kazda MUSI istniec w rejestrze; ta tablica jest zabezpieczeniem przed
 * zgubieniem sekcji przy przepisywaniu ukladu.
 *
 * `year-heatmap` byla czescia karty „Godziny", nie osobna sekcja — po
 * wydzieleniu ma wlasny wpis, wiec tez jest tutaj.
 */
const INVENTORY_BEFORE_REFACTOR = [
  'trips',
  'earnings-month',
  'monthly-goal',
  'effective-rate',
  'hours-month',
  'year-heatmap',
  'activity',
  'projects-schedule',
  'invoices',
  'quarters',
  'weekly-accounting-summary',
  'activity-analysis',
  'upcoming',
  'quick-actions',
] as const

describe('rejestr sekcji Pulpitu', () => {
  it('ma unikalne id', () => {
    const ids = DASHBOARD_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size, `duplikaty id: ${ids.join(', ')}`).toBe(ids.length)
  })

  it('ma dokladnie jedna sekcje hero', () => {
    const hero = DASHBOARD_SECTIONS.filter((s) => s.tier === 'hero')
    expect(hero.map((s) => s.id)).toHaveLength(1)
  })

  it('miesci sie w budzecie nad zagieciem: najwyzej 3 sekcje primary', () => {
    const primary = DASHBOARD_SECTIONS.filter((s) => s.tier === 'primary')
    expect(
      primary.map((s) => s.id),
      'kazda karta ponad budzet spycha pierwsza akcje pod zagiecie',
    ).toHaveLength(3)
  })

  it('montuje hero i primary od razu, a archive leniwie', () => {
    for (const section of DASHBOARD_SECTIONS) {
      if (section.tier === 'hero' || section.tier === 'primary') {
        expect(section.loading, `${section.id} nad zagieciem musi byc eager`).toBe('eager')
      }
      if (section.tier === 'archive') {
        expect(section.loading, `${section.id} w archiwum musi byc lazy`).toBe('lazy')
      }
    }
  })

  it('sekcja poza globalnym okresem nazywa swoj zakres', () => {
    // Dzisiejszy bug: zakladki mowia „Miesiac" i naglowek karty tez mowi
    // „ZAROBKI · MIESIAC", a sekcje z wlasnym zakresem nie mowia nic.
    const silent = DASHBOARD_SECTIONS.filter(
      (s) => !s.respondsToPeriod && !s.ownRangeLabel,
    )
    expect(
      silent.map((s) => s.id),
      'bez ownRangeLabel uzytkownik nie wie, jaki okres oglada',
    ).toEqual([])
  })

  it('sekcja reagujaca na okres nie duplikuje etykiety zakresu', () => {
    const duplicated = DASHBOARD_SECTIONS.filter(
      (s) => s.respondsToPeriod && s.ownRangeLabel,
    )
    expect(
      duplicated.map((s) => s.id),
      'zakres pokazuja zakladki — wlasna etykieta byla by drugim zrodlem prawdy',
    ).toEqual([])
  })

  it('nie zgubil zadnej sekcji z inwentaryzacji', () => {
    const ids = new Set(DASHBOARD_SECTIONS.map((s) => s.id))
    const missing = INVENTORY_BEFORE_REFACTOR.filter((id) => !ids.has(id))
    expect(missing, `sekcje znikniete z Pulpitu: ${missing.join(', ')}`).toEqual([])
  })

  it('kazda sekcja ma tytul i komponent', () => {
    for (const section of DASHBOARD_SECTIONS) {
      expect(section.title.length, `${section.id} bez tytulu`).toBeGreaterThan(0)
      // Sekcje leniwe to wynik `next/dynamic`, czyli obiekt (lazy), a nie
      // funkcja — dlatego sprawdzamy „da sie wyrenderowac", nie „jest funkcja".
      expect(
        ['function', 'object'].includes(typeof section.Component),
        `${section.id} bez komponentu`,
      ).toBe(true)
    }
  })

  it('hero jest widoczne i rozwiniete domyslnie', () => {
    const hero = DASHBOARD_SECTIONS.find((s) => s.tier === 'hero')!
    expect(hero.defaultVisible).toBe(true)
    expect(hero.defaultCollapsed).toBe(false)
  })
})
