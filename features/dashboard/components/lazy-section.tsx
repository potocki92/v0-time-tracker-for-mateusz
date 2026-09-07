'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SkeletonBlock } from '@/components/common/SkeletonBlock'

/**
 * Montuje zawartosc dopiero, gdy sekcja zbliza sie do viewportu.
 *
 * Po zamontowaniu sekcja ZOSTAJE w drzewie — nie odmontowujemy jej przy
 * wyjsciu z ekranu, bo drugi montaz kosztowalby tyle samo, co pierwszy,
 * a dane i tak trzyma cache TanStack Query. Skeleton widac wiec raz.
 */
export function LazySection({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (mounted) return
    const element = anchor.current
    if (!element) return

    // Srodowiska bez IntersectionObserver (starsza przegladarka, jsdom)
    // dostaja tresc od razu — brak obserwatora nie moze ukryc sekcji.
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setMounted(true)
        observer.disconnect()
      },
      // ~200 px zapasu: sekcja jest gotowa, zanim wjedzie w kadr.
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [mounted])

  return (
    <div ref={anchor}>
      {mounted ? children : <SkeletonBlock height={96} rounded="lg" />}
    </div>
  )
}
