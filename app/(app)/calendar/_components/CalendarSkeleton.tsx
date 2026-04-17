import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const EVENT_CELLS = new Set([3, 10, 16, 24, 28])

export function CalendarSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 h-12 sm:h-14 flex items-center px-4 gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="container space-y-4 px-4 py-4 sm:space-y-5 sm:py-6">
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-20 sm:w-24" />
                    <Skeleton className="h-6 w-16 sm:h-7 sm:w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg sm:h-9 sm:w-9" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-8 w-40 rounded-lg" />

        <Card className="border-border/60">
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-5 w-28 sm:w-36" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-5 rounded" />
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 sm:h-24 rounded-lg border border-border/40 bg-card p-1.5 sm:p-2 space-y-1.5"
                >
                  <Skeleton className="h-3 w-4" />
                  {EVENT_CELLS.has(idx) && (
                    <div className="space-y-1 mt-auto">
                      <Skeleton className="h-3 w-8 sm:w-10" />
                      <Skeleton className="h-2.5 w-12 sm:w-14 opacity-60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
