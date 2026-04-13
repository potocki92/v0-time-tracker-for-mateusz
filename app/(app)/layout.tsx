'use client'

import { DesktopHeader } from './_layout/components/header/DesktopHeader'
import { MobileHeader } from './_layout/components/header/MobileHeader'
import { MobileBottomNav } from './_layout/components/navigation/MobileBottomNav'
import { useAuth } from './_layout/hooks/useAuth'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()

  if (loading) return null

  return (
    <div className="min-h-screen pb-16">
      <DesktopHeader user={user} onLogout={logout} />
      <MobileHeader user={user} onLogout={logout} />

      <main>{children}</main>

      <MobileBottomNav />
    </div>
  )
}