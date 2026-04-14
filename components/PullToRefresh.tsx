'use client'

/**
 * Plik: src/components/PullToRefreshWrapper.tsx
 *
 * Wrapper dodający pull-to-refresh do dowolnego kontenera.
 * Pokazuje animowany wskaźnik (spinner + strzałka).
 *
 * Użycie w page.tsx dashboardu:
 *   <PullToRefreshWrapper onRefresh={handleRefresh}>
 *     <DashboardContent />
 *   </PullToRefreshWrapper>
 */

import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface PullToRefreshWrapperProps {
  children:    React.ReactNode
  className?:  string
}

export function PullToRefreshWrapper({
  children,
  className,
}: PullToRefreshWrapperProps) {
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() })
  }

  const { isPulling, pullProgress, isRefreshing, pullDistance } =
    usePullToRefresh({ onRefresh: handleRefresh })

  const showIndicator = isPulling || isRefreshing

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {/* Wskaźnik pull-to-refresh */}
      <div
        aria-hidden="true"
        style={{
          position:  'absolute',
          top:       0,
          left:      '50%',
          transform: `translateX(-50%) translateY(${showIndicator ? pullDistance - 48 : -48}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          zIndex:    50,
        }}
      >
        <div
          className={`
            flex h-10 w-10 items-center justify-center rounded-full
            bg-white shadow-md dark:bg-zinc-800
          `}
          style={{ opacity: Math.max(pullProgress, isRefreshing ? 1 : 0) }}
        >
          {isRefreshing ? (
            // Spinner gdy trwa refresh
            <svg
              className="h-5 w-5 animate-spin text-zinc-600 dark:text-zinc-300"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="3"
                strokeDasharray="60" strokeDashoffset="45"
              />
            </svg>
          ) : (
            // Strzałka rotująca się wraz z postępem pullowania
            <svg
              className="h-5 w-5 text-zinc-600 dark:text-zinc-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform:  `rotate(${pullProgress * 180}deg)`,
                transition: 'transform 0.1s linear',
              }}
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Główna zawartość — przesuwa się razem z pullaniem */}
      <div
        style={{
          transform:  `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}