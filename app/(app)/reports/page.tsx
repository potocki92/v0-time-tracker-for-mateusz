import { Suspense } from 'react'
import { ReportsContent, ReportsSkeleton } from '@/features/reports'

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  )
}
