'use client'

import { useRouter } from 'next/navigation'
import { useProjectsData } from '../hooks/useProjectsData'
import {
  AllProjectsSection,
  BudgetUtilizationSection,
  FeaturedSection,
  HeaderSection,
  KpiSection,
  StatusBreakdownSection,
} from './sections'

/**
 * Linear-style dark composition for the Projects module.
 *
 * Structure (mobile-first, single column up to md):
 *   - Header (period eyebrow, count badge, primary CTA)
 *   - KPI grid (4 tiles: All / Active / Done / Total budget)
 *   - Featured project (top priority active card with Track CTA)
 *   - Status breakdown (cross-status mix)
 *   - Budget utilisation (per-project burn vs contracted budget)
 *   - All projects (filterable list with pill tabs)
 *
 * Each section is a thin client wrapper around `useProjectsData()` so
 * Suspense fallback (page.tsx → <ProjectsSkeleton />) covers initial load
 * and per-section memoisation isolates re-renders.
 */
export function ProjectsContent() {
  const { data } = useProjectsData()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pb-28 pt-2 sm:px-4 md:max-w-5xl md:px-6 md:pb-10 md:pt-3 lg:px-8">
        <HeaderSection
          total={data.projects.length}
          onCreate={() => router.push('/projects?new=1')}
        />

        <KpiSection />
        <FeaturedSection />
        <StatusBreakdownSection />
        <BudgetUtilizationSection />
        <AllProjectsSection />
      </div>
    </div>
  )
}
