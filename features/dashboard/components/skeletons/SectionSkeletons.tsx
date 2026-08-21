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
        Klasy paska sa KOPIA <header> z LinearTopBar — lacznie z `hidden … md:flex`
        i z ujemnymi marginesami az do `xl:-mx-8`.

        Widocznosc: poprzednia wersja pokazywala pasek na KAZDEJ szerokosci, a tresc
        ma go dopiero od `md:`. Na telefonie skeleton rysowal wiec pasek, ktorego
        tresc nie ma, i po podmianie strona skakala w gore o cala jego wysokosc.

        Marginesy: kontener dashboardu ma `px-3 sm:px-4 xl:px-8`. Bez `xl:-mx-8`
        pasek skeletonu od 1280 px konczylby sie 32 px przed krawedzia, a pasek
        tresci do niej siega — przesuniecie w poziomie na samej podmianie.

        Wysokosc: `h-8` przyciskow (32) + `py-2` (16) + `border-b` (1) = 49 px,
        dokladnie tyle co realny pasek. Poprzednia wersja miala bloczki 40 px
        i wychodzila 57 px.
      */}
      <div className="sticky top-0 z-40 -mx-3 hidden border-b border-hairline bg-surface-0/85 px-3 py-2 backdrop-blur-md md:-mx-4 md:flex md:items-center md:justify-between md:px-4 xl:-mx-8 xl:px-8">
        <SkeletonBlock height={14} className="w-40" />
        <div className="flex items-center gap-2">
          <SkeletonBlock height={32} className="w-8" rounded="md" />
          <SkeletonBlock height={32} className="w-8" rounded="md" />
        </div>
      </div>

      {/*
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

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[0, 1, 2].map((i) => (
        <DarkBox key={i}>
          <SkeletonBlock height={12} className="w-16" />
          <SkeletonBlock height={24} className="mt-2 w-12" />
          <SkeletonBlock height={10} className="mt-1 w-16" />
        </DarkBox>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <DarkBox>
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock height={14} className="w-16" />
          <SkeletonBlock height={10} className="w-28" />
        </div>
        <SkeletonBlock height={10} className="w-32" />
      </div>
      <SkeletonBlock height={108} className="mt-4" rounded="md" />
    </DarkBox>
  )
}

export function InvoicesSkeleton() {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="space-y-1.5">
          <SkeletonBlock height={14} className="w-20" />
          <SkeletonBlock height={10} className="w-24" />
        </div>
        <SkeletonBlock height={20} className="w-16" rounded="md" />
      </div>
      <div className="space-y-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
          >
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock height={14} className="w-40" />
              <SkeletonBlock height={10} className="w-24" />
            </div>
            <SkeletonBlock height={14} className="w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
