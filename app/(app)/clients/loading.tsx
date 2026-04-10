import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-8/12" />
            </div>

            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}
