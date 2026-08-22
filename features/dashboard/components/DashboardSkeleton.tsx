import { SkeletonBlock } from '@/components/common/SkeletonBlock'
import {
  CollapsedSectionSkeleton,
  HeaderSkeleton,
  HeroSkeleton,
  KpiSkeleton,
} from './skeletons'

/**
 * Fallback dla <Suspense> w page.tsx i dla loading.tsx.
 *
 * Kontener i uklad sa KOPIA tych z DashboardContent — jesli zmieniasz uklad
 * tam, zmien go tu w TYM SAMYM commicie. Wymusza to
 * __test__/config/dashboard-skeleton.test.ts.
 *
 * Liczba zwinietych wierszy stoi tu jako stala, a nie jest liczona z rejestru:
 * import rejestru wciagnalby do chunka `loading.tsx` wszystkie komponenty
 * sekcji. Zgodnosc z rejestrem pilnuje test.
 */
export const COLLAPSED_SECTION_ROWS = 11

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

        <div className="space-y-4">
          <HeroSkeleton />

          {/* Pas nad zagieciem — trzy karty, tak jak Zarobki / Cel / Godziny */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>

          {/* Wiersz z „Dostosuj pulpit" */}
          <div className="flex justify-end">
            <SkeletonBlock height={44} className="w-40" rounded="md" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: COLLAPSED_SECTION_ROWS }, (_, i) => (
              <CollapsedSectionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
