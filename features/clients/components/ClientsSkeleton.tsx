import { PageContainer } from '@/components/common/section/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { SURFACE } from '@/components/ui/tokens'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ClientsSkeleton() {
  return (
    <PageContainer data-testid="section-skeleton">
      {/* Karta „Aktualny zleceniodawca" — bez niej lista podskakiwała
          o własną wysokość w momencie dojścia danych. */}
      <div className={cn('space-y-3 p-4', SURFACE.card)}>
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden border-b px-4 py-3 md:block">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-1 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="hidden h-8 w-20 sm:block" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
