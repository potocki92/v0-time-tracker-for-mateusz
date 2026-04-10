import { Skeleton } from '@/components/ui/skeleton'

export default function InvoicesSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-full sm:w-36" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3 sm:items-center"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 sm:w-36" />
              <Skeleton className="h-3 w-36 sm:w-48" />
            </div>

            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
