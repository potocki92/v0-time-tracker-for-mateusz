'use client'

/**
 * Plik: src/app/(app)/settings/_components/NotificationSettings.tsx
 *
 * UI do włączania/wyłączania powiadomień push.
 * Umieść w sekcji ustawień lub jako widget w dashboardzie.
 */

import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  // Przeglądarki bez Web Push API (Safari < 16, Firefox mobile)
  if (!isSupported) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">
          Twoja przeglądarka nie obsługuje powiadomień push.
        </p>
      </div>
    )
  }

  // User zablokował powiadomienia — nie możemy o nie poprosić ponownie
  if (permission === 'denied') {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Powiadomienia zablokowane
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Aby włączyć powiadomienia, odblokuj je ręcznie w ustawieniach przeglądarki
          (kłódka przy adresie strony).
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Przypomnienia o fakturach
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Powiadomienia push gdy termin płatności zbliża się za 7 dni, 1 dzień
            lub upłynął.
          </p>

          {/* Status */}
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isSubscribed
                  ? 'bg-emerald-500'
                  : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isSubscribed ? 'Aktywne' : 'Wyłączone'}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          aria-pressed={isSubscribed}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
            border-2 border-transparent transition-colors duration-200
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50
            ${isSubscribed
              ? 'bg-emerald-500'
              : 'bg-zinc-200 dark:bg-zinc-700'
            }
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
              ring-0 transition duration-200
              ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {/* Info o harmonogramie */}
      {isSubscribed && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          Powiadomienia są wysyłane codziennie o 9:00. Możesz je wyłączyć w
          dowolnym momencie.
        </p>
      )}
    </div>
  )
}