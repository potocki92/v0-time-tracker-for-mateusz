'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useAuth }    from './_layout/hooks/useAuth'
import { AppSidebar } from './_layout/components/sidebar/AppSidebar'
import { MobileHeader } from './_layout/components/sidebar/MobileHeader'
import { BottomNav } from './_layout/components/bottom-nav'
import { SettingsDrawer } from './settings/_components'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()

  if (loading) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <a href="#main-content" className="skip-link">
        Przejdź do treści
      </a>
      <AppSidebar user={user} onLogout={logout} />
      {/* SidebarInset: wypycha content gdy sidebar rozwinięty */}
      <SidebarInset>
        <MobileHeader user={user} onLogout={logout} />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </SidebarInset>
      <SettingsDrawer />
      <BottomNav />
    </SidebarProvider>
  )
}
