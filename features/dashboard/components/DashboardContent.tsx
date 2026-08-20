'use client'

import { TripsSection } from '@/features/trips'
import {
  ActivitySection,
  DashboardRangeProvider,
  EarningsSection,
  EffectiveRateSection,
  Footer,
  GoalSection,
  HeaderSection,
  HoursSection,
  InvoicesSection,
  ProjectsSection,
  QuarterlySummarySection,
  QuickActionsSection,
  SectionHeader,
  UpcomingSection,
  WeeklyGlanceSection,
  WeeklySummarySection,
} from './sections'

/**
 * Sekcje NIE maja wlasnych granic <Suspense>.
 *
 * Kazda z nich czyta `useDashboardData()` — ten sam klucz, ktory strona
 * prefetchuje i hydruje — wiec zadna nie moze zawiesic sie osobno: zanim
 * DashboardContent w ogole zaczyna renderowac, dane sa juz w cache.
 * Trzynascie zagniezdzonych fallbackow bylo martwym kodem, ktory tylko
 * mnozyl warstwy skeletonow. Granice zostaja dwie: `loading.tsx` (segment)
 * i `<Suspense>` w page.tsx (dane).
 *
 * Wyjatek potwierdzajacy regule: `QuarterlySummarySection` ma wlasny klucz,
 * ale czyta go zwyklym `useQuery` i sam rysuje swoj stan ladowania —
 * tez nigdy nie zawiesza.
 */
export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full space-y-4 px-3 pb-24 pt-2 sm:px-4 md:pb-10 md:pt-3">
          <HeaderSection />

          <TripsSection />

          <EarningsSection />

          <GoalSection />

          <HoursSection />

          <EffectiveRateSection />

          <ActivitySection />

          <SectionHeader label="Harmonogram i rozliczenia" />

          <ProjectsSection />

          <InvoicesSection />

          <QuarterlySummarySection />

          <WeeklySummarySection />

          <SectionHeader label="Wkrótce" />

          <UpcomingSection />

          <QuickActionsSection />

          <WeeklyGlanceSection />

          <Footer />
        </div>
      </main>
    </DashboardRangeProvider>
  )
}
