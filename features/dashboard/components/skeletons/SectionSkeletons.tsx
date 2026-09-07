import { SkeletonBlock } from '@/components/common/SkeletonBlock'

/**
 * Linear-style dark skeletons.
 * Każdy box ma stałą wysokość — eliminuje CLS po hydracji.
 */

function DarkBox({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-surface-1 p-4 ${className ?? ''}`}
    >
      {children}
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

        HeroGreeting — w poprzedniej wersji skeletonu NIE BYLO go wcale, wiec caly
        blok (dateline + naglowek + zakladki zakresu) wskakiwal znikad na kazdej
        szerokosci.

        Wysokosci policzone z modelu pudelkowego, bo skala typografii jest plynna
        (`clamp(… + Nvw, …)` w globals.css) i linia rosnie razem z oknem:

          dateline   text-2xs/1.4           14.1 px @390 → 15.2 px @1440
          naglowek   text-2xl→3xl/1.25      28.7 px @390 → 34.8 px @1440
          akapit     text-xs/1.4 sm:hidden  20.9 px @390 → 0 (od sm: wjezdza w <h1>)
          zakladki   border + p-1 + py-1.5  36.1 px @390 → 40.9 px @1440

        Dwa srodkowe bloczki dostaja wysokosc w KLASIE, nie w propsie `height`:
        `height` lata w inline style, ktory wygralby z kazdym breakpointem.
        Przez ten akapit `sm:hidden` naglowek jest na telefonie WYZSZY niz na
        desktopie, mimo mniejszej czcionki.
      */}
      <div className="space-y-2.5">
        <SkeletonBlock height={15} className="w-56" />
        <div>
          <SkeletonBlock className="h-[29px] w-72 sm:h-[35px]" />
          <SkeletonBlock className="mt-1 h-[21px] w-56 sm:hidden" />
        </div>
        <SkeletonBlock rounded="lg" className="h-9 w-56 sm:h-[41px] sm:w-64" />
      </div>
    </>
  )
}

export function KpiSkeleton() {
  return (
    <DarkBox>
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
    </DarkBox>
  )
}

/** Karta hero „Dzisiaj": eyebrow, duza liczba, wiersz kontekstu, dwie akcje. */
export function HeroSkeleton() {
  return (
    <DarkBox className="p-4 sm:p-5">
      <SkeletonBlock height={12} className="w-40" />
      <SkeletonBlock height={40} className="mt-2 w-56" />
      <SkeletonBlock height={14} className="mt-2 w-48" />
      <div className="mt-4 flex gap-2">
        <SkeletonBlock height={44} className="w-52" rounded="md" />
        <SkeletonBlock height={44} className="w-40" rounded="md" />
      </div>
    </DarkBox>
  )
}

/**
 * Zwinieta sekcja to sam naglowek: strzalka, tytul i ewentualna etykieta
 * zakresu. 44 px, bo tyle ma cel dotykowy przycisku w <SectionShell>.
 */
export function CollapsedSectionSkeleton() {
  return <SkeletonBlock height={44} className="w-full" rounded="md" />
}
