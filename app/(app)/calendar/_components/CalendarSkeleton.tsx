import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const EVENT_CELLS = new Set([3, 10, 16, 24, 28])

export function CalendarSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-12 items-center gap-3 border-b bg-card/50 px-4 sm:h-14">
        <Skeleton className="h-7 w-7 rounded-md skeleton" />
        <Skeleton className="h-4 w-32 skeleton" />
      </div>

      <div className="container space-y-4 px-4 py-4 sm:space-y-5 sm:py-6">
        {/* 4 KPI bento cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60 py-0">
              <CardContent className="space-y-3 p-3 sm:p-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-2.5 w-20 skeleton sm:w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg skeleton sm:h-9 sm:w-9" />
                </div>
                <Skeleton className="h-7 w-16 skeleton sm:w-20" />
                <Skeleton className="h-1.5 w-full rounded-full skeleton" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-8 w-40 rounded-lg skeleton" />

        {/* Calendar */}
        <Card className="border-border/60">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-md skeleton" />
              <Skeleton className="h-5 w-28 skeleton sm:w-36" />
              <Skeleton className="h-8 w-8 rounded-md skeleton" />
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-5 rounded skeleton" />
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 space-y-1.5 rounded-lg border border-border/40 bg-card p-1.5 sm:h-24 sm:p-2"
                >
                  <Skeleton className="h-3 w-4 skeleton" />
                  {EVENT_CELLS.has(idx) && (
                    <div className="mt-auto space-y-1">
                      <Skeleton className="h-3 w-8 skeleton sm:w-10" />
                      <Skeleton className="h-2.5 w-12 opacity-60 skeleton sm:w-14" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights placeholder */}
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60 py-0">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 skeleton" />
                  <Skeleton className="h-3 w-12 skeleton" />
                </div>
                <Skeleton className="h-32 w-full rounded skeleton" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
