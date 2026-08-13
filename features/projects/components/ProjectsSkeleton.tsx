import { Skeleton } from '@/components/ui/skeleton'

/**
 * Wysokości bloków odpowiadają realnemu układowi ProjectsContent —
 * inaczej po hydracji widać skok treści.
 */
export function ProjectsSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        {/* HeaderSection — sam przycisk akcji, wyrównany do prawej */}
        <div className="flex justify-end">
          <Skeleton className="h-8 w-32 rounded-lg bg-[#212126]" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl bg-[#17171a]" />
          ))}
        </div>

        <Skeleton className="h-[300px] rounded-2xl bg-[#17171a]" />
        <Skeleton className="h-[128px] rounded-2xl bg-[#17171a]" />
        <Skeleton className="h-[520px] rounded-2xl bg-[#17171a]" />
      </div>
    </div>
  )
}
