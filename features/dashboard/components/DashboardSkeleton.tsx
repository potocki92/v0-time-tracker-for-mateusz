import { SkeletonBlock } from '@/components/common/SkeletonBlock'
import {
  ChartSkeleton,
  HeaderSkeleton,
  InvoicesSkeleton,
  KpiSkeleton,
  StatsSkeleton,
} from './skeletons'

/**
 * Fallback dla <Suspense> w page.tsx i dla loading.tsx.
 *
 * Nie jest to rzadki przypadek, jak twierdzil poprzedni komentarz: `page.tsx`
 * trzyma `await prefetchQuery` w komponencie POD granica, wiec skeleton leci
 * na kazdym zimnym wejsciu na /dashboard, zanim wroca zapytania Supabase.
 *
 * Kontener i grid sa KOPIA tych z DashboardContent. Poprzednia wersja miala
 * `max-w-2xl` i `pb-28`, podczas gdy tresc jest pelnoekranowa (`xl:max-w-[1440px]`)
 * z `pb-24 md:pb-10` — podmiana przerzucala wiec cala strone z 672 px na pelna
 * szerokosc i zmieniala wysokosc stopki.
 *
 * Zasada: jesli zmieniasz uklad w DashboardContent, zmien go tu w TYM SAMYM
 * commicie. Wymusza to __test__/config/dashboard-skeleton.test.ts.
 *
 * Dobor bloczkow do slotow jest przyblizony i taki zostanie: realne karty nie
 * maja ani jednej stalej wysokosci w klasach — liczy je tresc, wiec ta sama
 * karta jest inna dla kazdego uzytkownika. Odwzorowana jest LICZBA i KOLEJNOSC
 * sekcji oraz ich miejsce w siatce, bo to one decyduja o przesunieciu.
 */
export function DashboardSkeleton() {
  return (
    <div
      className="min-h-screen bg-surface-0 text-white"
      data-testid="section-skeleton"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full space-y-4 px-3 pb-24 pt-2 sm:px-4 md:pb-10 md:pt-3 xl:max-w-[1440px] xl:px-8">
        <HeaderSkeleton />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Trips */}
          <div className="min-w-0 lg:col-span-12">
            <InvoicesSkeleton />
          </div>

          {/* Pas KPI — trzy karty po 4/12, tak jak Zarobki / Cel / Efektywna stawka */}
          <div className="min-w-0 lg:col-span-4">
            <KpiSkeleton />
          </div>
          <div className="min-w-0 lg:col-span-4">
            <KpiSkeleton />
          </div>
          <div className="min-w-0 lg:col-span-4">
            <KpiSkeleton />
          </div>

          {/* Kolumna glowna — osiem pozycji, tyle samo co w tresci */}
          <div className="min-w-0 space-y-4 lg:col-span-12 xl:col-span-8">
            <ChartSkeleton />
            <ChartSkeleton />
            {/* SectionHeader "Harmonogram i rozliczenia" — text-2xs/1.4 = 15 px */}
            <SkeletonBlock height={15} className="w-48" rounded="sm" />
            <InvoicesSkeleton />
            <InvoicesSkeleton />
            <InvoicesSkeleton />
            <InvoicesSkeleton />
            <ChartSkeleton />
          </div>

          {/* Szyna */}
          <div className="min-w-0 lg:col-span-12 xl:col-span-4">
            <div className="space-y-4">
              {/* SectionHeader "Wkrotce" — text-2xs/1.4 = 15 px */}
              <SkeletonBlock height={15} className="w-40" rounded="sm" />
              <InvoicesSkeleton />
              <StatsSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
