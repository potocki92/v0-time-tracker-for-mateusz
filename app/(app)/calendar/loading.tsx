import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

const EVENT_CELLS = new Set([3, 10, 16, 24, 28])

export default function CalendarSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b bg-card/50 h-14 flex items-center px-4 gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="container space-y-5 px-4 py-6">
        {/* Stats cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Skeleton className="h-8 w-40 rounded-lg" />

        {/* Calendar */}
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-7 rounded" />
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className="h-20 sm:h-24 rounded-lg border border-border/40 bg-card p-2 space-y-1.5">
                  <Skeleton className="h-3 w-4" />
                  {EVENT_CELLS.has(idx) && (
                    <div className="space-y-1 mt-auto">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-2.5 w-14 opacity-60" />
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