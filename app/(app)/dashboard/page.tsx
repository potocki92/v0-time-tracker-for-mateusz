// page.tsx — Server Component (bez "use client")
import { Suspense } from 'react'
import { DashboardSkeleton } from './_components/DashboardSkeleton'
import { DashboardContent } from './_components/DashboardContent'
import { getDashboardData } from './_services/dashboard.service'

// Ten komponent musi być WEWNĄTRZ Suspense żeby boundary zadziałało
async function DashboardFetcher() {
  const data = await getDashboardData()
  return <DashboardContent data={data} />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardFetcher />
    </Suspense>
  )
}
