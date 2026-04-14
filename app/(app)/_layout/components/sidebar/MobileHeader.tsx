'use client'

/**
 * MobileHeader.tsx — uproszczona wersja po migracji do sidebara.
 *
 * Na mobile sidebar wysuwa się z lewej (sheet/drawer).
 * Header zawiera tylko trigger do otwarcia + akcje po prawej.
 *
 * MobileBottomNav zostaje usunięty — sidebar zastępuje go całkowicie.
 */

import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle }    from '../theme/ThemeToggle'
import { UserMenu }       from '../user/UserMenu'
import type { User }      from '@supabase/supabase-js'

interface Props {
  user:     User | null
  onLogout: () => void
}

export function MobileHeader({ user, onLogout }: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Trigger otwierający sidebar jako sheet z lewej */}
      <SidebarTrigger className="-ml-1" />

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}