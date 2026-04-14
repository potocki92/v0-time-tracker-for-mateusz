'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './_layout/components/sidebar/AppSidebar'
import { useAuth }    from './_layout/hooks/useAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()

  if (loading) return null

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar user={user} onLogout={logout} />

      {/* SidebarInset: wypycha content gdy sidebar rozwinięty */}
      <SidebarInset>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}