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
          {/* max-width dopiero od `xl:` — nizej i tak nie ma z czego przycinac,
              a dashboard byl jedyna sekcja panelu bez zadnego limitu szerokosci.

              UWAGA: te klasy sa skopiowane do DashboardSkeleton. Jesli zmieniasz
              je tutaj, zmien je tam w TYM SAMYM commicie — inaczej podmiana
              skeletonu na tresc przesunie strone w poziomie. Pilnuje tego
              __test__/config/dashboard-skeleton.test.ts. */}
          <div className="mx-auto w-full space-y-4 px-3 pb-24 pt-2 sm:px-4 md:pb-10 md:pt-3 xl:max-w-[1440px] xl:px-8">
            {/*
              HeaderSection (powitanie + zakladki zakresu) zostaje POZA gridem:
              nie jest karta, a w komorce siatki wpadloby w pas KPI i przesunelo
              caly wiersz. Breadcrumb i akcje sa wyzej, w WorkspaceHeader.
            */}
            <HeaderSection />

            <div data-dashboard-grid className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <DashboardCell className="lg:col-span-12">
                <TripsSection />
              </DashboardCell>

              {/* Pas KPI — trzy rowne karty od 1024 px */}
              <DashboardCell className="lg:col-span-4">
                <EarningsSection />
              </DashboardCell>

              <DashboardCell className="lg:col-span-4">
                <GoalSection />
              </DashboardCell>

              <DashboardCell className="lg:col-span-4">
                <EffectiveRateSection />
              </DashboardCell>

              {/* Kolumna glowna: wykresy i listy, ktore potrzebuja szerokosci */}
              <div
                data-dashboard-main
                className="min-w-0 space-y-4 lg:col-span-12 xl:col-span-8"
              >
                <HoursSection />

                <ActivitySection />

                <SectionHeader label="Harmonogram i rozliczenia" />

                <ProjectsSection />

                <InvoicesSection />

                <QuarterlySummarySection />

                <WeeklySummarySection />

                <WeeklyGlanceSection />
              </div>

              {/*
                Szyna. Komorka NIE dostaje `self-start` — musi rozciagnac sie
                na wysokosc wiersza, zeby wewnetrzny `sticky` mial po czym jechac.
                Sticky siedzi na DZIECKU komorki, nie na samej komorce.
              */}
              <div
                data-dashboard-rail
                className="min-w-0 lg:col-span-12 xl:col-span-4"
              >
                {/* top-16 = 64 px, a nie 16 px: WorkspaceHeader ma h-14 + krawedz,
                    czyli 57 px, wiec szyna przyklejona nizej wjezdzalaby pod niego
                    i chowala naglowek "Wkrotce". 64 - 57 = 7 px luzu. */}
                <div className="space-y-4 xl:sticky xl:top-16">
                  <SectionHeader label="Wkrótce" />

                  <UpcomingSection />

                  <QuickActionsSection />
                </div>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </DashboardDerivedProvider>
    </DashboardRangeProvider>
  )
}
