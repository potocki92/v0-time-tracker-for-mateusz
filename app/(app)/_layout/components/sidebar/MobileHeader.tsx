'use client'

/**
 * MobileHeader.tsx — pasek na urządzeniach mobilnych.
 *
 * Hamburger otwiera sidebar (drawer), obok wyświetlamy etykietę aktualnej
 * podstrony (np. "Pulpit"). Po prawej: theme toggle + user menu.
 * Na desktopie ukryty (`md:hidden`) — pełen sidebar zastępuje ten pasek.
 */

import type { User } from '@supabase/supabase-js'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '../theme/ThemeToggle'
import { UserMenu } from '../user/UserMenu'
import { usePageLabel } from '../../hooks'

interface Props {
  user: User | null
  onLogout: () => void
}

export function MobileHeader({ user, onLogout }: Props) {
  const { page } = usePageLabel()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md md:hidden">
      <div className="flex h-[var(--app-bar-height)] items-center justify-between px-[var(--header-inline-padding)]">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {page}
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
