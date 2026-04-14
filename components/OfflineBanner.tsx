import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { useEffect, useState } from "react"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // Pokazujemy banner przez chwilę po powrocie online ("Połączono z powrotem")
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline,      setWasOffline]      = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      return
    }

    if (wasOffline) {
      // Właśnie wróciliśmy online
      setShowReconnected(true)
      setWasOffline(false)

      const timer = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  const isVisible = !isOnline || showReconnected
  if (!isVisible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-20 left-1/2 z-50
        -translate-x-1/2
        flex items-center gap-2 rounded-full px-4 py-2
        text-sm font-medium shadow-lg
        transition-all duration-300
        ${!isOnline
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'bg-emerald-500 text-white'
        }
      `}
      style={{
        animation: 'slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {!isOnline ? (
        <>
          {/* Pulsujący czerwony dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Brak połączenia
        </>
      ) : (
        <>
          <span className="text-base">✓</span>
          Połączono z powrotem
        </>
      )}
    </div>
  )
}