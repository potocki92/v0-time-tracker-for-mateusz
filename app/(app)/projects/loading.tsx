import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsSkeleton() {
  return (
    <div className="container space-y-6 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
            <Skeleton className="h-6 w-3/4" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
