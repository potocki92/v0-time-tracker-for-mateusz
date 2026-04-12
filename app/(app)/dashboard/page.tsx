// page.tsx — Server Component (bez "use client")
import { Suspense } from 'react'
import { DashboardSkeleton } from './_components/DashboardSkeleton'
import { DashboardContent } from './_components/DashboardContent'
import { getDashboardData } from './_services/dashboard.service'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
