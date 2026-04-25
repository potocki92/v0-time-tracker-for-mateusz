import { SkeletonBlock } from './SkeletonBlock'

/**
 * Linear-style dark skeletons.
 * Każdy box ma stałą wysokość — eliminuje CLS po hydracji.
 */

function DarkBox({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 sm:p-5 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 -mx-3 border-b border-[#1a1a1a] bg-black/80 px-3 pb-3 pt-3 backdrop-blur-md sm:-mx-4 sm:px-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock height={24} className="w-32" />
          <SkeletonBlock height={10} className="w-44" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock height={40} className="w-10" rounded="lg" />
          <SkeletonBlock height={40} className="w-10" rounded="lg" />
        </div>
      </div>
    </div>
  )
}

export function KpiSkeleton() {
  return (
    <DarkBox>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock height={12} className="w-20" />
          <SkeletonBlock height={36} className="w-44" />
          <SkeletonBlock height={12} className="w-32" />
          <SkeletonBlock height={20} className="w-16" rounded="full" />
        </div>
        <SkeletonBlock height={76} className="w-[76px]" rounded="full" />
      </div>
      <SkeletonBlock height={132} className="mt-4" rounded="lg" />
    </DarkBox>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[0, 1, 2].map((i) => (
        <DarkBox key={i}>
          <SkeletonBlock height={12} className="w-16" />
          <SkeletonBlock height={24} className="mt-2 w-12" />
          <SkeletonBlock height={10} className="mt-1 w-16" />
        </DarkBox>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <DarkBox>
      <div className="flex items-end justify-between">
        <div className="space-y-1.5">
          <SkeletonBlock height={14} className="w-16" />
          <SkeletonBlock height={10} className="w-28" />
        </div>
        <SkeletonBlock height={10} className="w-32" />
      </div>
      <SkeletonBlock height={108} className="mt-4" rounded="md" />
    </DarkBox>
  )
}

export function InvoicesSkeleton() {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3 sm:px-5">
        <div className="space-y-1.5">
          <SkeletonBlock height={14} className="w-20" />
          <SkeletonBlock height={10} className="w-24" />
        </div>
        <SkeletonBlock height={20} className="w-16" rounded="md" />
      </div>
      <div className="space-y-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[#161616] px-4 py-3 last:border-b-0 sm:px-5"
          >
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock height={14} className="w-40" />
              <SkeletonBlock height={10} className="w-24" />
            </div>
            <SkeletonBlock height={14} className="w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
