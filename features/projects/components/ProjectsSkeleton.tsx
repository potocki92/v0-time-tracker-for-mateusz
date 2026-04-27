import { Skeleton } from '@/components/ui/skeleton'

export function ProjectsSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        <div className="space-y-3">
          <Skeleton className="h-3 w-44 bg-[#161616]" />
          <Skeleton className="h-8 w-40 bg-[#161616]" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 bg-[#161616]" />
            <Skeleton className="h-8 w-32 bg-[#161616]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl bg-[#0e0e0e]" />
          ))}
        </div>

        <Skeleton className="h-[260px] rounded-2xl bg-[#0e0e0e]" />
        <Skeleton className="h-[220px] rounded-2xl bg-[#0e0e0e]" />
        <Skeleton className="h-[260px] rounded-2xl bg-[#0e0e0e]" />
        <Skeleton className="h-[400px] rounded-2xl bg-[#0e0e0e]" />
      </div>
    </div>
  )
}
