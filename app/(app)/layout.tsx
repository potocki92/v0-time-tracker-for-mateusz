'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useAuth }    from './_layout/hooks/useAuth'
import { AppSidebar } from './_layout/components/sidebar/AppSidebar'
import { MobileHeader } from './_layout/components/sidebar/MobileHeader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()

  if (loading) return null

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar user={user} onLogout={logout} />
      {/* SidebarInset: wypycha content gdy sidebar rozwinięty */}
      <SidebarInset>
        <MobileHeader user={user} onLogout={logout} />
        <div className="flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}