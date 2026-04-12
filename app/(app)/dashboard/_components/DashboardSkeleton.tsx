import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function CardSkeleton({ headerWidth = 'w-24', children }: {
  headerWidth?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className={`h-4 ${headerWidth}`} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// Szkielet pojedynczego baru wykresu
function FakeBar({ heightPercent }: { heightPercent: number }) {
  return (
    <Skeleton
      className="flex-1 rounded-sm"
      style={{ height: `${heightPercent}%` }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">

      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2">
        <Skeleton className="mb-1 h-8 w-52" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-3 h-10 w-full rounded-md" />
      </div>

      {/* EarningsCard + GoalCard */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardContent>
        </Card>

        <CardSkeleton headerWidth="w-32">
          <div className="space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </CardSkeleton>
      </div>

      {/* StatsCards */}
      <div className="grid grid-cols-3 gap-4">
        {(['w-8', 'w-12', 'w-16'] as const).map((w, i) => (
          <Card key={i} className="text-center">
            <CardContent className="pt-6">
              <Skeleton className="mx-auto mb-2 h-6 w-6 rounded-full" />
              <Skeleton className={`mx-auto h-7 ${w}`} />
              <Skeleton className="mx-auto mt-1 h-3 w-14" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Chart skeleton */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-1 h-3 w-52" />
            {/* Grouping tabs */}
            <Skeleton className="mt-2 h-7 w-full rounded-md" />
            {/* Period sub-tabs */}
            <Skeleton className="mt-1.5 h-6 w-full rounded-md" />
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {/* Fake bar chart */}
            <div className="flex h-[200px] items-end gap-[3px] px-1">
              {[35, 60, 45, 80, 55, 90, 40, 70, 50, 85, 30, 65, 75, 45, 55, 80, 40, 70, 60, 50, 85].map((h, i) => (
                <FakeBar key={i} heightPercent={h} />
              ))}
            </div>
            {/* Fake x-axis labels */}
            <div className="mt-2 flex justify-between px-1">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-8" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoices skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
