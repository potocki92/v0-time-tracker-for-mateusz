import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROWS = 8
const SKELETON_COLUMNS = [
  { width: 'w-32' },   // invoice_number
  { width: 'w-44' },   // client
  { width: 'w-24' },   // date
  { width: 'w-20' },   // status badge
  { width: 'w-24' },   // amount
  { width: 'w-8' },    // actions
] as const

export default function InvoicesSkeleton() {
  return (
    <div
      className="container space-y-6 px-4 py-8"
      role="status"
      aria-busy="true"
      aria-label="Ładowanie listy faktur"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Toolbar: search + actions */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-9 w-full max-w-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Filter chips + date range */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/70 bg-card dark:border-zinc-800/70">
        <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
          <div className="flex items-center gap-6">
            {SKELETON_COLUMNS.map((col, idx) => (
              <Skeleton key={idx} className={`h-3 ${col.width}`} />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
          {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-6 px-4 py-3">
              {SKELETON_COLUMNS.map((col, colIdx) => (
                <Skeleton key={colIdx} className={`h-4 ${col.width}`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
      </div>

      <span className="sr-only">Ładowanie...</span>
    </div>
  )
}
