'use client'

/**
 * MobileHeader.tsx — uproszczona wersja po migracji do sidebara.
 *
 * Na mobile sidebar wysuwa się z lewej (sheet/drawer).
 * Header zawiera tylko trigger do otwarcia + akcje po prawej.
 *
 * MobileBottomNav zostaje usunięty — sidebar zastępuje go całkowicie.
 */

import type { User } from '@supabase/supabase-js'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '../theme/ThemeToggle'
import { UserMenu } from '../user/UserMenu'

interface Props {
  user: User | null
  onLogout: () => void
}

export function MobileHeader({ user, onLogout }: Props) {
  return (
    <header className="z-40 border-b border-border bg-background">
      <div className="flex items-center justify-between px-[var(--header-inline-padding)] py-[var(--header-y-padding)]">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <span className="text-xs font-semibold tracking-wide uppercase text-foreground/90">
            Time Tracker
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  )
}
