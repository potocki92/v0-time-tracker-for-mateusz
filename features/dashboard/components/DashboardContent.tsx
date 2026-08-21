'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TripsSection } from '@/features/trips'
import {
  ActivitySection,
  DashboardDerivedProvider,
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

type DashboardCellProps = {
  /** Klasy col-span. Grid ma na mobile jedna kolumne, wiec span podaje sie od `lg:`. */
  className?: string
  children: ReactNode
}

/**
 * Komorka gridu. Dwa powody, dla ktorych ten <div> musi istniec:
 *
 * 1. `min-w-0` — dziecko gridu ma domyslnie `min-width: auto`, wiec wykres
 *    albo tabela szersza od kolumny rozpycha caly uklad zamiast sie skurczyc.
 *
 * 2. EarningsSection, GoalSection i TripsSection zwracaja FRAGMENTY z kilkoma
 *    rodzenstwami. Bez wrappera kazde rodzenstwo staloby sie osobna komorka
 *    gridu i uklad by sie rozjechal.
 */
function DashboardCell({ className, children }: DashboardCellProps) {
  return <div className={cn('min-w-0', className)}>{children}</div>
}

export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      {/* Pochodne (filtr zakresu, podzial na zrealizowane/planowane, sumy)
          licza sie tu raz i ida w dol przez context. Provider siedzi WEWNATRZ
          DashboardRangeProvider, bo czyta z niego zakres. */}
      <DashboardDerivedProvider>
        {/* Nie <main> — AppShell renderuje juz landmark main z id="main-content",
            na ktory celuje skip-link. Zagniezdzony drugi main duplikuje landmark
            i lamie nawigacje czytnika ekranu. Pozostale sekcje (Calendar,
            Projects, Reports) uzywaja tu <div> — to wyrownanie do nich. */}
        <div className="min-h-screen bg-surface-0 text-white">
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
        </div>
      </DashboardDerivedProvider>
    </DashboardRangeProvider>
  )
}
