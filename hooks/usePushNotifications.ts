'use client'

/**
 * #20 — Powiadomienia push o zbliżającym się terminie płatności faktury
 *
 * Plik: src/hooks/usePushNotifications.ts
 *
 * Architektura:
 * 1. Przeglądarka → Service Worker (sw.js) → Web Push API → serwer VAPID
 * 2. Supabase Edge Function odbiera scheduled job (pg_cron lub zewnętrzny cron)
 *    i wysyła push do subskrybentów których faktury są przeterminowane
 * 3. Service Worker wyświetla powiadomienie nawet gdy app jest zamknięta
 *
 * Ten plik: hook do zarządzania subskrypcją po stronie klienta.
 *
 * Install: npm install web-push  (tylko server-side — Edge Function)
 * Klucze VAPID: npx web-push generate-vapid-keys
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clientEnv } from '@/lib/env'

// ── Typy ──────────────────────────────────────────────────────────────────────

export type NotificationPermission = 'default' | 'granted' | 'denied'

interface UsePushNotificationsReturn {
  /** Czy Web Push jest w ogóle dostępny w tej przeglądarce */
  isSupported:      boolean
  /** Aktualny stan pozwolenia */
  permission:       NotificationPermission
  /** Czy user ma aktywną subskrypcję */
  isSubscribed:     boolean
  /** Trwa operacja (subscribe/unsubscribe) */
  isLoading:        boolean
  /** Poproś o pozwolenie i zapisz subskrypcję */
  subscribe:        () => Promise<void>
  /** Usuń subskrypcję */
  unsubscribe:      () => Promise<void>
}

// ── Helper: urlBase64ToUint8Array ─────────────────────────────────────────────
// Web Push wymaga klucza VAPID jako Uint8Array

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const output  = new Uint8Array(raw.length) as Uint8Array<ArrayBuffer>
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePushNotifications(): UsePushNotificationsReturn {
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  const [permission,    setPermission]    = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'default'
  )
  const [isSubscribed,  setIsSubscribed]  = useState(false)
  const [isLoading,     setIsLoading]     = useState(false)

  // Sprawdź czy user ma już aktywną subskrypcję przy mount
  useEffect(() => {
    if (!isSupported) return

    void (async () => {
      const registration = await navigator.serviceWorker.ready
      const existing     = await registration.pushManager.getSubscription()
      setIsSubscribed(Boolean(existing))
    })()
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported) return
    setIsLoading(true)

    try {
      // 1. Poproś o pozwolenie
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return

      // 2. Zarejestruj Service Worker (jeśli nie jest jeszcze zarejestrowany)
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')

      // 3. Utwórz subskrypcję Push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true, // wymagane przez spec — zawsze pokazuj powiadomienie
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      // 4. Wyślij subskrypcję do Supabase (zapisz w tabeli push_subscriptions)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id:      user.id,
          endpoint:     subscription.endpoint,
          // Konwertuj do JSON — tak zapisuje web-push
          subscription: JSON.parse(JSON.stringify(subscription)),
          created_at:   new Date().toISOString(),
        }, { onConflict: 'user_id' })  // jeden rekord per user

      if (error) throw error

      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const existing     = await registration.pushManager.getSubscription()

      if (existing) {
        await existing.unsubscribe()
      }

      // Usuń z Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
      }

      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}