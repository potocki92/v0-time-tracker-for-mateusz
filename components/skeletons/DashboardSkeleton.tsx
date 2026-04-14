/**
 * #15 — Zsynchronizowana animacja skeleton między kartami
 *
 * Plik: src/components/skeletons/DashboardSkeleton.tsx
 *
 * Problem: każdy <div className="animate-pulse"> startuje własną animację
 * od momentu montażu → karty "migają" z przesunięciem fazowym.
 *
 * Rozwiązanie: globalny CSS custom property --skeleton-phase obliczany
 * raz i przypisany do :root. Wszystkie skeleton elementy używają
 * animation-delay: var(--skeleton-phase) → ta sama faza dla wszystkich.
 *
 * Alternatywa bez JS: animation-delay: inherit na dzieciach + animation-delay
 * ustawiony na rodzicu. Tutaj używamy podejścia CSS-only z @keyframes
 * i jednym wspólnym animation-iteration-count.
 */

import type { CSSProperties, ReactNode } from 'react'

// ── Bazowy element skeleton ───────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

/**
 * Skeleton używa klasy `skeleton` zamiast `animate-pulse`.
 * Animacja zdefiniowana globalnie w globals.css — jedna dla wszystkich.
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-md bg-zinc-200 dark:bg-zinc-700 ${className}`}
      style={style}
    />
  )
}

// ── Karty skeleton ────────────────────────────────────────────────────────────

export function EarningsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="mb-3 h-4 w-28" />
      <Skeleton className="mb-2 h-8 w-40" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Słupki wykresu */}
      <div className="flex h-40 items-end gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.sin(i) * 40 + 40}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

export function InvoicesListSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="mb-4 h-5 w-24" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function GoalProgressSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="mb-4 h-5 w-28" />
      <Skeleton className="mb-2 h-3 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// ── Pełny skeleton dashboardu ─────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Karty z metrykami — 2 kolumny na mobile, 4 na desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <EarningsCardSkeleton key={i} />
        ))}
      </div>

      {/* Wykres */}
      <ChartSkeleton />

      {/* Dwie kolumny: Goal + Faktury */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <GoalProgressSkeleton />
        <InvoicesListSkeleton />
      </div>
    </div>
  )
}