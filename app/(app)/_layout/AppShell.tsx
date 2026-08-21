'use client'

import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { WorkspaceHeader } from '@/components/workspace/workspace-header'
import { WorkspaceHeaderSlotProvider } from '@/components/workspace/workspace-header-slot'
import { performLogout } from '@/lib/auth/logout'
import { AppSidebar } from './components/sidebar/AppSidebar'
import { ThemeToggle } from './components/theme/ThemeToggle'
import { UserMenu } from './components/user/UserMenu'
import { BottomNav } from './components/bottom-nav'
import { AuthWatcher } from './AuthWatcher'

// Panel ustawień otwiera się dopiero z akcji użytkownika (useUiStore), a ciągnie
// za sobą formularze + upload avatara. Bez dynamic() ładowałby się na każdej
// stronie panelu.
const SettingsDrawer = dynamic(
  () => import('@/features/settings').then((mod) => mod.SettingsDrawer),
  { ssr: false },
)

interface AppShellProps {
  user: User | null
  badges?: Partial<Record<string, number>>
  children: React.ReactNode
}

/**
 * Interaktywna powłoka panelu. Autoryzację robi serwerowy layout — tutaj
 * nie ma już żadnej bramki `loading`, więc treść strony trafia do HTML
 * od razu, bez czekania na hydrację.
 *
 * `WorkspaceHeader` stoi tu, nad `<main>`, więc każda trasa panelu dostaje
 * dokładnie jeden nagłówek. Chrome mobilny (hamburger, motyw, menu
 * użytkownika) wjeżdża do niego slotami — na desktopie te same funkcje daje
 * sidebar, dlatego znikają razem z nim.
 */
export function AppShell({ user, badges, children }: AppShellProps) {
  const queryClient = useQueryClient()

  const logout = useCallback(async () => {
    await performLogout(queryClient)
  }, [queryClient])

  return (
    <SidebarProvider defaultOpen={true}>
      <a href="#main-content" className="skip-link">
        Przejdź do treści
      </a>
      <AppSidebar user={user} onLogout={logout} badges={badges} />
      {/* SidebarInset: wypycha content gdy sidebar rozwinięty */}
      <SidebarInset>
        <WorkspaceHeaderSlotProvider>
          <WorkspaceHeader
            leading={<SidebarTrigger className="-ml-1 md:hidden" />}
            trailing={
              <div className="flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <UserMenu user={user} onLogout={logout} />
              </div>
            }
          />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
        </WorkspaceHeaderSlotProvider>
      </SidebarInset>
      <SettingsDrawer />
      <BottomNav />
      <AuthWatcher />
    </SidebarProvider>
  )
}
