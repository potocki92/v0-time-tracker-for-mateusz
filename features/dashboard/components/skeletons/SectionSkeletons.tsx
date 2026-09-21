import { SkeletonBlock } from '@/components/common/SkeletonBlock'
import { DASHBOARD_SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

/**
 * Linear-style dark skeletons.
 * Każdy box ma stałą wysokość — eliminuje CLS po hydracji.
 */

/**
 * Karta sekcji Pulpitu w wersji szkieletowej — z paskiem naglowka, bo tresc
 * te ma: `DashboardSectionCard` rysuje naglowek NA karcie (ikona, tytul,
 * zakres). Bez tego paska podmiana skeletonu na tresc przesuwalaby kazda
 * karte o jego wysokosc.
 *
 * 45 px = min-h-[44px] naglowka + wlos pod nim.
 */
function DashboardCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(DASHBOARD_SURFACE.card, 'overflow-hidden')}>
      <div className="flex h-[45px] items-center gap-2 border-b border-hairline px-4">
        <SkeletonBlock height={18} className="w-[18px]" rounded="sm" />
        <SkeletonBlock height={14} className="w-32" />
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <>
      {/*
        Paska breadcrumbow tu NIE MA i miec nie moze. Naglowek obszaru roboczego
        przeniosl sie do `AppShell`, czyli PONAD granice <Suspense> dashboardu —
        jest na ekranie przez caly czas ladowania. Bloczek udajacy go w tym
        miejscu dorysowywalby drugi pasek, ktorego tresc nie ma, i strona
        skakalaby o jego wysokosc na samej podmianie.

        Wysokosci policzone z modelu pudelkowego, bo skala typografii jest plynna
        (`clamp(… + Nvw, …)` w globals.css) i linia rosnie razem z oknem:

          dateline   text-2xs/1.4        14.1 px @390 → 15.2 px @1440
          naglowek   text-3xl→4xl/1.2    31.0 px @390 → 34.6 px @640+
          podtytul   text-xs→sm/1.45     17.5 px @390 → 21.0 px @640+
          zakladki   h-11                44 px, stale — pelna szerokosc

        Trzy dolne bloczki dostaja wysokosc w KLASIE, nie w propsie `height`:
        `height` lata w inline style, ktory wygralby z kazdym breakpointem.
      */}
      <div className="space-y-3">
        <div className="space-y-1">
          <SkeletonBlock height={15} className="w-56" />
          <SkeletonBlock className="h-[31px] w-64 sm:h-[35px]" />
          <SkeletonBlock className="h-[18px] w-48 sm:h-[21px]" />
        </div>
        <SkeletonBlock rounded="lg" className="h-11 w-full sm:max-w-md" />
      </div>
    </>
  )
}

export function KpiSkeleton() {
  return (
    <DashboardCardSkeleton>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock height={12} className="w-20" />
          <SkeletonBlock height={36} className="w-44" />
          <SkeletonBlock height={12} className="w-32" />
          <SkeletonBlock height={20} className="w-16" rounded="full" />
        </div>
        <SkeletonBlock height={76} className="w-[76px]" rounded="full" />
      </div>
      <SkeletonBlock height={132} className="mt-4" rounded="lg" />
    </DashboardCardSkeleton>
  )
}

/** Karta hero „Dzisiaj": eyebrow, duza liczba, wiersz kontekstu, dwie akcje. */
export function HeroSkeleton() {
  return (
    <DashboardCardSkeleton>
      <SkeletonBlock height={12} className="w-40" />
      <SkeletonBlock height={40} className="mt-2 w-56" />
      <SkeletonBlock height={14} className="mt-2 w-48" />
      <div className="mt-4 flex gap-2">
        <SkeletonBlock height={44} className="w-52" rounded="md" />
        <SkeletonBlock height={44} className="w-40" rounded="md" />
      </div>
    </DashboardCardSkeleton>
  )
}

/**
 * Wiersz zwinietej sekcji WEWNATRZ panelu — bez wlasnej ramki i promienia,
 * bo wlos miedzy wierszami rysuje `divide-y` panelu (tak samo jak w tresci).
 * 44 px, bo tyle ma cel dotykowy przycisku w <SectionShell>.
 */
export function CollapsedSectionSkeleton() {
  return (
    <div className="flex h-[44px] items-center gap-2.5 px-4">
      <SkeletonBlock height={16} className="w-4" rounded="sm" />
      <SkeletonBlock height={14} className="w-36" />
    </div>
  )
}
