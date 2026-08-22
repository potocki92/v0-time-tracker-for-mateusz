import { PageContainer } from '@/components/common/section/PageContainer'
import { SkeletonBlock } from '@/components/common/SkeletonBlock'

export function ReportsSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0" data-testid="section-skeleton">
      <PageContainer>
        {/* Bez bloczka menu eksportu — „Eksportuj raport" siedzi w
            WorkspaceHeader, poza granicą <Suspense> tej sekcji. */}
        <div className="min-w-0 space-y-2">
          <SkeletonBlock height={10} className="w-24" />
          <SkeletonBlock height={28} className="w-40" />
          <SkeletonBlock height={14} className="w-32" />
        </div>

        <SkeletonBlock height={120} rounded="lg" />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} height={120} rounded="lg" />
          ))}
        </div>

        <SkeletonBlock height={280} rounded="lg" />
      </PageContainer>
    </div>
  )
}
