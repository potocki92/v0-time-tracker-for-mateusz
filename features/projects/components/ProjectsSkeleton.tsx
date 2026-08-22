import { PageContainer } from '@/components/common/section/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Wysokości bloków odpowiadają realnemu układowi ProjectsContent —
 * inaczej po hydracji widać skok treści.
 */
export function ProjectsSkeleton() {
  return (
    <div className="min-h-screen bg-surface-0 text-white" data-testid="section-skeleton">
      <PageContainer>
        {/* Bez bloczka akcji — „Nowy projekt" siedzi w WorkspaceHeader,
            czyli poza granicą <Suspense> tej sekcji. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl bg-surface-3" />
          ))}
        </div>

        <Skeleton className="h-[300px] rounded-2xl bg-surface-3" />
        <Skeleton className="h-[128px] rounded-2xl bg-surface-3" />
        <Skeleton className="h-[520px] rounded-2xl bg-surface-3" />
      </PageContainer>
    </div>
  )
}
