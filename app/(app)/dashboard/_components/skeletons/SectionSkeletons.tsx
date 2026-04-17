import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonBlock } from './SkeletonBlock'

/**
 * Minimalne, per-sekcja fallbacki dla niezależnych <Suspense>.
 * Zamiast 130-liniowego mirroru layoutu — 3–5 bloczków na sekcję.
 * Każda sekcja ma stabilną, znaną wysokość (contain-intrinsic-size w SkeletonBlock),
 * co eliminuje Cumulative Layout Shift po zhydraowaniu danych.
 */

export function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock height={28} className="w-52" />
          <SkeletonBlock height={12} className="w-36" />
        </div>
        <SkeletonBlock height={40} className="sm:w-64" />
      </div>
    </div>
  )
}

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <SkeletonBlock height={16} className="w-20" />
        </CardHeader>
        <CardContent className="space-y-3">
          <SkeletonBlock height={36} className="w-44" />
          <SkeletonBlock height={12} className="w-32" />
          <SkeletonBlock height={24} className="w-16" rounded="full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <SkeletonBlock height={16} className="w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <SkeletonBlock height={8} rounded="full" />
          <div className="flex justify-between">
            <SkeletonBlock height={16} className="w-10" />
            <SkeletonBlock height={16} className="w-28" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="text-center">
          <CardContent className="space-y-2 pt-6">
            <SkeletonBlock height={24} rounded="full" className="mx-auto w-6" />
            <SkeletonBlock height={28} className="mx-auto w-12" />
            <SkeletonBlock height={12} className="mx-auto w-14" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2 pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <SkeletonBlock height={20} className="w-40" />
          <SkeletonBlock height={20} className="w-16" rounded="full" />
        </div>
        <SkeletonBlock height={28} />
        <SkeletonBlock height={24} />
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <SkeletonBlock height={200} rounded="lg" />
      </CardContent>
    </Card>
  )
}

export function InvoicesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <SkeletonBlock height={20} className="w-36" />
          <SkeletonBlock height={20} className="w-8" rounded="full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} height={48} rounded="lg" />
        ))}
      </CardContent>
    </Card>
  )
}
