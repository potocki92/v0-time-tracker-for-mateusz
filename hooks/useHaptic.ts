'use client'

/**
 * #14 — Haptic feedback (PWA / mobile)
 *
 * Plik: src/hooks/useHaptic.ts
 *
 * Używa navigator.vibrate (Web Vibration API) — działa na Android Chrome/PWA.
 * Na iOS (Safari) vibrate nie jest dostępne — hook cicho ignoruje.
 * Capacitor: jeśli app zostanie opakowana w Capacitor, można podmienić
 * implementację na @capacitor/haptics bez zmiany call sites.
 *
 * Użycie:
 *   const haptic = useHaptic()
 *   haptic.success()   // po oznaczeniu faktury jako zapłaconej
 *   haptic.error()     // po błędzie mutacji
 *   haptic.light()     // subtelna odpowiedź na tap
 */

import { useCallback } from 'react'

// ── Wzorce wibracji ───────────────────────────────────────────────────────────
// Format: [czas wibracji ms, przerwa ms, czas wibracji ms, ...]

const PATTERNS = {
  /** Krótki podwójny puls — "sukces" */
  success: [10, 50, 10] as number[],
  /** Trójka krótkich — "błąd/ostrzeżenie" */
  error:   [30, 30, 30, 30, 60] as number[],
  /** Jeden bardzo krótki — "light tap" */
  light:   [8] as number[],
  /** Jeden średni — "medium" */
  medium:  [25] as number[],
  /** Dwa długie — "heavy" */
  heavy:   [50, 30, 50] as number[],
} as const

export type HapticPattern = keyof typeof PATTERNS

interface UseHapticReturn {
  success: () => void
  error:   () => void
  light:   () => void
  medium:  () => void
  heavy:   () => void
  /** Vibrate z własnym wzorcem */
  vibrate: (pattern: HapticPattern | number[]) => void
  /** Czy Vibration API jest dostępne */
  isSupported: boolean
}

function triggerVibration(pattern: number[]): void {
  if (typeof navigator === 'undefined') return
  if (!('vibrate' in navigator)) return

  try {
    navigator.vibrate(pattern)
  } catch {
    // Safari/iOS cicho rzuca — ignorujemy
  }
}

export function useHaptic(): UseHapticReturn {
  const isSupported =
    typeof navigator !== 'undefined' && 'vibrate' in navigator

  const vibrate = useCallback((pattern: HapticPattern | number[]) => {
    const resolvedPattern = Array.isArray(pattern) ? pattern : PATTERNS[pattern]
    triggerVibration(resolvedPattern)
  }, [])

  const success = useCallback(() => triggerVibration(PATTERNS.success), [])
  const error   = useCallback(() => triggerVibration(PATTERNS.error),   [])
  const light   = useCallback(() => triggerVibration(PATTERNS.light),   [])
  const medium  = useCallback(() => triggerVibration(PATTERNS.medium),  [])
  const heavy   = useCallback(() => triggerVibration(PATTERNS.heavy),   [])

  return { success, error, light, medium, heavy, vibrate, isSupported }
}