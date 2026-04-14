'use client'

/**
 * #18 — Offline banner
 *
 * Plik: src/hooks/useOnlineStatus.ts + src/components/OfflineBanner.tsx
 *
 * Używa navigator.onLine + zdarzenia 'online'/'offline'.
 * Banner pojawia się z animacją slide-down, znika po powrocie online.
 * TanStack Query automatycznie refetchuje po powrocie (networkMode: 'online').
 */

import { useEffect, useState, useSyncExternalStore } from 'react'

// ── useOnlineStatus ───────────────────────────────────────────────────────────

/**
 * useSyncExternalStore zapewnia spójność między SSR (zawsze true)
 * a hydracją po stronie klienta.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener('online',  callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online',  callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot(): boolean {
  return navigator.onLine
}

function getServerSnapshot(): boolean {
  // SSR: zawsze "online" — unikamy hydration mismatch
  return true
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}