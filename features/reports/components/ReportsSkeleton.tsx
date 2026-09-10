import { PageContainer } from '@/components/common/section/PageContainer'
import { SkeletonBlock } from '@/components/common/SkeletonBlock'

/**
 * Szkielet raportu 2.0 — odwzorowuje UKLAD, ktory za chwile go zastapi:
 * naglowek, pasek filtrow, szesc kafelkow KPI, wykres, podzial i tabela.
 *
 * Spinner na calej stronie byl gorszy: ekran skakal, bo nic nie rezerwowalo
 * wysokosci sekcji.
 */
export function ReportsSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0" data-testid="section-skeleton">
      <PageContainer>
        {/* Bez bloczka menu eksportu — „Eksport" siedzi w WorkspaceHeader,
            poza granica <Suspense> tej sekcji. */}
        <div className="min-w-0 space-y-2">
          <SkeletonBlock height={10} className="w-24" />
          <SkeletonBlock height={28} className="w-40" />
          <SkeletonBlock height={14} className="w-32" />
        </div>

        <SkeletonBlock height={120} rounded="lg" />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} height={116} rounded="lg" />
          ))}
        </div>

        <SkeletonBlock height={300} rounded="lg" />
        <SkeletonBlock height={280} rounded="lg" />
        <SkeletonBlock height={200} rounded="lg" />
      </PageContainer>
    </div>
  )
}
