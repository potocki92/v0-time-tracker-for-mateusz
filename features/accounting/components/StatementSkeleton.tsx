import { PageContainer } from '@/components/common/section/PageContainer'
import { SkeletonBlock } from '@/components/common/SkeletonBlock'

/**
 * Szkielet wykazu — odwzorowuje UKLAD, ktory za chwile go zastapi: naglowek,
 * pasek filtrow, podsumowanie i rejestr. Spinner na calej stronie byl gorszy:
 * ekran skakal, bo nic nie rezerwowalo wysokosci sekcji.
 */
export function StatementSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0" data-testid="section-skeleton">
      <PageContainer>
        <div className="min-w-0 space-y-2">
          <SkeletonBlock height={10} className="w-24" />
          <SkeletonBlock height={28} className="w-56" />
          <SkeletonBlock height={14} className="w-40" />
        </div>

        <SkeletonBlock height={150} rounded="lg" />
        <SkeletonBlock height={160} rounded="lg" />
        <SkeletonBlock height={420} rounded="lg" />
      </PageContainer>
    </div>
  )
}
