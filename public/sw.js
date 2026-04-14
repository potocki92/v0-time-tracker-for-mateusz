/**
 * Plik: public/sw.js
 *
 * Service Worker obsługujący zdarzenia Push.
 * Wyświetla powiadomienie nawet gdy aplikacja jest zamknięta.
 *
 * WAŻNE: ten plik musi być w /public/sw.js (root scope aplikacji).
 * Nie może być w /src — Service Worker musi mieć scope '/' aby
 * przechwycić powiadomienia dla całej domeny.
 *
 * Next.js: dodaj do next.config.ts:
 *   headers: [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }]
 */

/* eslint-disable no-restricted-globals */

// ── Typy payload (muszą pasować do tego co wysyła Edge Function) ──────────────

/**
 * @typedef {Object} PushPayload
 * @property {'invoice_due'|'invoice_overdue'} type
 * @property {string} invoiceId
 * @property {string} invoiceName
 * @property {number} amount
 * @property {string} currency
 * @property {string} dueDate      - ISO string
 * @property {number} daysLeft     - ujemna = po terminie
 */

// ── Push event ────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    console.error('[SW] Invalid push payload')
    return
  }

  const options = buildNotificationOptions(payload)

  // waitUntil zapewnia że SW nie zostanie uśpiony przed pokazaniem powiadomienia
  event.waitUntil(
    self.registration.showNotification(buildTitle(payload), options)
  )
})

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const invoiceId = event.notification.data?.invoiceId
  const url       = invoiceId
    ? `/invoices?highlight=${invoiceId}`
    : '/invoices'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Jeśli aplikacja jest już otwarta — focus i navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Aplikacja zamknięta — otwórz nową kartę
      clients.openWindow(url)
    })
  )
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTitle(payload) {
  if (payload.daysLeft < 0) {
    return `⚠️ Faktura przeterminowana: ${payload.invoiceName}`
  }
  if (payload.daysLeft === 0) {
    return `🔴 Faktura płatna dziś: ${payload.invoiceName}`
  }
  return `📅 Zbliża się termin: ${payload.invoiceName}`
}

function buildNotificationOptions(payload) {
  const dueDate = new Date(payload.dueDate).toLocaleDateString('pl-PL', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  const amountStr = `${payload.amount} ${payload.currency}`

  let body
  if (payload.daysLeft < 0) {
    body = `Faktura na ${amountStr} jest przeterminowana o ${Math.abs(payload.daysLeft)} dni (termin: ${dueDate})`
  } else if (payload.daysLeft === 0) {
    body = `Faktura na ${amountStr} jest płatna dziś`
  } else {
    body = `Faktura na ${amountStr} — termin za ${payload.daysLeft} dni (${dueDate})`
  }

  return {
    body,
    icon:  '/icons/icon-192x192.png',  // PWA ikona
    badge: '/icons/badge-72x72.png',   // małe monochrome badge (Android)
    tag:   `invoice-${payload.invoiceId}`, // deduplikacja — nie pokazuj dwa razy tego samego
    renotify: false,

    // Dane dostępne w notificationclick
    data: {
      invoiceId: payload.invoiceId,
      url:       `/invoices?highlight=${payload.invoiceId}`,
    },

    // Przyciski akcji (Android Chrome)
    actions: [
      {
        action: 'mark-paid',
        title:  'Oznacz jako zapłacone',
        icon:   '/icons/check-72x72.png',
      },
      {
        action: 'dismiss',
        title:  'Przypomnij jutro',
      },
    ],

    // Wibracja (wzorzec jak w useHaptic.ts)
    vibrate: [100, 50, 100],

    // Pokaż nawet gdy app jest na pierwszym planie
    requireInteraction: payload.daysLeft <= 0,
  }
}