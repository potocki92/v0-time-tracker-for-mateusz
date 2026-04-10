import { Skeleton } from '@/components/ui/skeleton'

const EVENT_CELLS = new Set([3, 10, 16, 24])

export default function CalendarSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-muted">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div key={idx} className="aspect-square bg-background p-1.5 sm:p-2">
              <Skeleton className="mb-1 h-3 w-5" />

              {EVENT_CELLS.has(idx) ? (
                <div className="space-y-1">
                  <Skeleton className="h-1.5 w-10 bg-blue-200/70 dark:bg-blue-400/30" />
                  <Skeleton className="h-1.5 w-8 bg-emerald-200/70 dark:bg-emerald-400/30" />
                  {idx % 2 === 0 && <Skeleton className="h-1.5 w-6 bg-amber-200/70 dark:bg-amber-400/30" />}
                </div>
              ) : (
                <Skeleton className="h-1.5 w-7 opacity-60" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
