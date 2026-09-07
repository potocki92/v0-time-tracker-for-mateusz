'use client'

import { DashboardSections } from './dashboard-sections'
import { DashboardDerivedProvider, DashboardRangeProvider, Footer, HeaderSection } from './sections'
import { periodFromRange } from '../sections/period'
import { useDashboardRange } from './sections/shared/DashboardRangeContext'

/**
 * Powloka Pulpitu: providery, naglowek z zakladkami okresu i lista sekcji.
 *
 * Tego pliku nie ma juz o co pytac „ile sekcji ma Pulpit" — odpowiedz siedzi
 * w `sections/registry.ts`, a to, ktore z nich sa widoczne, zwiniete i w jakiej
 * kolejnosci, w `hooks/use-dashboard-layout.ts`. Wczesniej byla to jedna
 * pietnastoelementowa lista JSX, montowana w calosci przy kazdym wejsciu.
 *
 * Sekcje NIE maja wlasnych granic <Suspense>: kazda czyta `useDashboardData()`
 * — ten sam klucz, ktory strona prefetchuje i hydruje — wiec zadna nie moze
 * zawiesic sie osobno. Granice zostaja dwie: `loading.tsx` (segment)
 * i `<Suspense>` w page.tsx (dane).
 */
export function DashboardContent() {
  return (
    <DashboardRangeProvider>
      {/* Pochodne (filtr zakresu, podzial na zrealizowane/planowane, sumy)
          licza sie tu raz i ida w dol przez context. Provider siedzi WEWNATRZ
          DashboardRangeProvider, bo czyta z niego zakres. */}
      <DashboardDerivedProvider>
        {/* Nie <main> — AppShell renderuje juz landmark main z id="main-content",
            na ktory celuje skip-link. */}
        <div className="min-h-screen bg-surface-0 text-white">
          {/* UWAGA: te klasy sa skopiowane do DashboardSkeleton. Jesli zmieniasz
              je tutaj, zmien je tam w TYM SAMYM commicie — inaczej podmiana
              skeletonu na tresc przesunie strone w poziomie. Pilnuje tego
              __test__/config/dashboard-skeleton.test.ts. */}
          <div className="mx-auto w-full space-y-4 px-3 pb-24 pt-2 sm:px-4 md:pb-10 md:pt-3 xl:max-w-[1440px] xl:px-8">
            <HeaderSection />
            <DashboardBody />
            <Footer />
          </div>
        </div>
      </DashboardDerivedProvider>
    </DashboardRangeProvider>
  )
}

/**
 * Osobny komponent tylko po to, zeby zakres z URL czytac POD providerem —
 * `useDashboardRange` rzuca poza nim.
 */
function DashboardBody() {
  const { range } = useDashboardRange()
  return <DashboardSections period={periodFromRange(range)} />
}
