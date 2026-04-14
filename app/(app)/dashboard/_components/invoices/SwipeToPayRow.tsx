'use client'

/**
 * #17 — Swipe-to-pay na fakturach
 *
 * Plik: src/app/(app)/dashboard/_components/InvoicesList/SwipeToPayRow.tsx
 *
 * Czyste touch events — bez framer-motion (mniejszy bundle).
 * Framer-motion wersja możliwa jako drop-in (zastąp inline style → motion.div).
 *
 * Zachowanie:
 * - Swipe w lewo odsłania zielony przycisk "Zapłacone"
 * - < 30% szerokości → wraca na miejsce (snap back)
 * - ≥ 30% szerokości → animacja do końca + markPaid()
 * - Swipe w prawo → ignorowany
 */

import { useCallback, useRef, useState } from 'react'
import { CheckIcon } from 'lucide-react'
import type { InvoiceRowProps } from './InvoicesList.types'

const TRIGGER_THRESHOLD = 0.3  // 30% szerokości elementu
const MAX_SWIPE         = 100  // px — szerokość odsłoniętego przycisku

interface SwipeToPayRowProps extends InvoiceRowProps {
  children: React.ReactNode
}

export function SwipeToPayRow({
  invoice,
  isPending,
  onMarkPaid,
  children,
}: SwipeToPayRowProps) {
  const [offset,      setOffset]      = useState(0)
  const [isSwiping,   setIsSwiping]   = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)

  const startX    = useRef(0)
  const startY    = useRef(0)
  const rowRef    = useRef<HTMLDivElement>(null)
  const isLocked  = useRef(false) // blokuje gdy jest już w trakcie animacji

  // ── Touch handlers ──────────────────────────────────────────────────────────

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isPending || isLocked.current) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setIsSwiping(false)
  }, [isPending])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPending || isLocked.current) return

    const deltaX = e.touches[0].clientX - startX.current
    const deltaY = Math.abs(e.touches[0].clientY - startY.current)

    // Jeśli scroll pionowy jest dominujący → nie swipujemy
    if (deltaY > Math.abs(deltaX) * 1.5) return

    // Tylko swipe w lewo
    if (deltaX > 0) return

    setIsSwiping(true)
    // Rubber band: po MAX_SWIPE spowalnia
    const raw     = Math.abs(deltaX)
    const clamped = raw <= MAX_SWIPE
      ? raw
      : MAX_SWIPE + (raw - MAX_SWIPE) * 0.2

    setOffset(-Math.min(clamped, MAX_SWIPE * 1.5))

    // Zapobiegaj scrollowi strony podczas swipe
    e.preventDefault()
  }, [isPending])

  const onTouchEnd = useCallback(() => {
    if (!isSwiping || isLocked.current) return

    const rowWidth   = rowRef.current?.offsetWidth ?? 300
    const threshold  = rowWidth * TRIGGER_THRESHOLD
    const absOffset  = Math.abs(offset)

    if (absOffset >= threshold) {
      // Przekroczono próg → animuj do końca i wywołaj markPaid
      isLocked.current = true
      setOffset(-MAX_SWIPE)
      setIsTriggered(true)

      setTimeout(() => {
        onMarkPaid(invoice.id)
        // Reset po akcji (optimistic update ukryje row przez localHidden)
        isLocked.current = false
        setOffset(0)
        setIsSwiping(false)
        setIsTriggered(false)
      }, 300)
    } else {
      // Za mały swipe → snap back
      setOffset(0)
      setIsSwiping(false)
    }
  }, [isSwiping, offset, onMarkPaid, invoice.id])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={rowRef}
      className="relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Tło — zielony przycisk odsłaniany przez swipe */}
      <div
        aria-hidden="true"
        className={`
          absolute inset-y-0 right-0 flex items-center justify-center
          rounded-xl bg-emerald-500 px-5
          transition-opacity duration-200
          ${isTriggered ? 'opacity-100' : 'opacity-90'}
        `}
        style={{ width: MAX_SWIPE }}
      >
        <CheckIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="ml-1.5 text-sm font-semibold text-white">Zapłacone</span>
      </div>

      {/* Wiersz faktury — przesuwa się w lewo */}
      <div
        className="relative bg-white dark:bg-zinc-900"
        style={{
          transform:  `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}