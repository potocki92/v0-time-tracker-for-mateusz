import dynamic from 'next/dynamic'
import { HeroToday } from '../components/hero-today'
import { EarningsSection } from '../components/sections/earnings/EarningsSection'
import { GoalSection } from '../components/sections/goal/GoalSection'
import { HoursSection } from '../components/sections/hours/HoursSection'
import type { DashboardSectionDef } from './types'

/**
 * JEDYNE zrodlo prawdy o tym, co stoi na Pulpicie.
 *
 * Przed tym rejestrem uklad byl dluga lista JSX w `DashboardContent`: pietnascie
 * sekcji o tej samej wadze wizualnej, wszystkie montowane naraz, okolo osmiu
 * ekranow przewijania na telefonie. Teraz kolejnosc, widocznosc i moment
 * montowania sa DANYMI — a `__test__/features/dashboard/registry.test.ts`
 * pilnuje budzetu nad zagieciem (1 hero + najwyzej 3 primary) i tego, ze
 * refaktor ukladu nie gubi zadnej sekcji.
 *
 * Sekcje `lazy` ida przez `next/dynamic`, wiec ich kod trafia do OSOBNYCH
 * chunkow — do initial JS trasy wchodzi tylko hero i pas primary.
 */
const lazySection = <T extends string>(
  load: () => Promise<{ [K in T]: DashboardSectionDef['Component'] }>,
  name: T,
) => dynamic(() => load().then((mod) => mod[name]))

export const DASHBOARD_SECTIONS: DashboardSectionDef[] = [
  {
    id: 'today-overview',
    title: 'Dzisiaj',
    tier: 'hero',
    respondsToPeriod: false,
    ownRangeLabel: 'dzisiaj',
    loading: 'eager',
    defaultVisible: true,
    defaultCollapsed: false,
    Component: HeroToday,
  },

  // ── Pas nad zagieciem: trzy liczby, po ktore uzytkownik wraca codziennie ──
  {
    id: 'earnings-month',
    title: 'Zarobki',
    tier: 'primary',
    respondsToPeriod: true,
    loading: 'eager',
    defaultVisible: true,
    defaultCollapsed: false,
    Component: EarningsSection,
  },
  {
    id: 'monthly-goal',
    title: 'Cel miesięczny',
    tier: 'primary',
    respondsToPeriod: true,
    loading: 'eager',
    defaultVisible: true,
    defaultCollapsed: false,
    Component: GoalSection,
  },
  {
    id: 'hours-month',
    title: 'Godziny',
    tier: 'primary',
    respondsToPeriod: true,
    loading: 'eager',
    defaultVisible: true,
    defaultCollapsed: false,
    Component: HoursSection,
  },

  // ── Drugi plan: zwiniete, montowane przy zblizeniu do viewportu ──
  {
    id: 'trips',
    title: 'Wyjazdy',
    tier: 'secondary',
    respondsToPeriod: false,
    ownRangeLabel: 'najbliższy wyjazd',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    // Barrel modulu Trips — `module-boundaries` dopuszcza tylko publiczne wejscie.
    Component: lazySection(() => import('@/features/trips'), 'TripsSection'),
  },
  {
    id: 'activity',
    title: 'Aktywność',
    tier: 'secondary',
    respondsToPeriod: true,
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/activity/ActivitySection'),
      'ActivitySection',
    ),
  },
  {
    id: 'projects-schedule',
    title: 'Harmonogram i rozliczenia',
    tier: 'secondary',
    respondsToPeriod: true,
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/projects/ProjectsSection'),
      'ProjectsSection',
    ),
  },
  {
    id: 'invoices',
    title: 'Faktury',
    tier: 'secondary',
    respondsToPeriod: true,
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/invoices/InvoicesSection'),
      'InvoicesSection',
    ),
  },
  {
    id: 'weekly-accounting-summary',
    title: 'Podsumowanie tygodnia',
    tier: 'secondary',
    respondsToPeriod: false,
    ownRangeLabel: 'bieżący tydzień',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/weekly-summary/WeeklySummarySection'),
      'WeeklySummarySection',
    ),
  },
  {
    id: 'activity-analysis',
    title: 'Analiza aktywności',
    tier: 'secondary',
    respondsToPeriod: false,
    ownRangeLabel: 'własny zakres wykresu',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/weekly-glance/WeeklyGlanceSection'),
      'WeeklyGlanceSection',
    ),
  },

  // ── Archiwum: rzadko otwierane, nigdy w initial JS ──
  {
    id: 'quarters',
    title: 'Kwartały',
    tier: 'archive',
    respondsToPeriod: false,
    ownRangeLabel: 'bieżący rok',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/quarterly-summary/QuarterlySummarySection'),
      'QuarterlySummarySection',
    ),
  },
  {
    id: 'year-heatmap',
    title: 'Rok w godzinach',
    tier: 'archive',
    respondsToPeriod: false,
    ownRangeLabel: 'ostatnie 53 tygodnie',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/year-heatmap/YearHeatmapSection'),
      'YearHeatmapSection',
    ),
  },
  {
    id: 'upcoming',
    title: 'Nadchodzące',
    tier: 'archive',
    respondsToPeriod: false,
    ownRangeLabel: 'przed nami',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/upcoming/UpcomingSection'),
      'UpcomingSection',
    ),
  },
  {
    id: 'effective-rate',
    title: 'Stawka efektywna',
    tier: 'archive',
    respondsToPeriod: true,
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/effective-rate/EffectiveRateSection'),
      'EffectiveRateSection',
    ),
  },
  {
    id: 'quick-actions',
    title: 'Szybkie akcje',
    tier: 'archive',
    respondsToPeriod: false,
    ownRangeLabel: 'skróty',
    loading: 'lazy',
    defaultVisible: true,
    defaultCollapsed: true,
    Component: lazySection(
      () => import('../components/sections/quick-actions/QuickActionsSection'),
      'QuickActionsSection',
    ),
  },
]
