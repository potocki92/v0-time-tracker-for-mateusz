'use client'

import type { User } from '@supabase/supabase-js'
import { DesktopNav } from '../navigation/DesktopNav'
import { UserMenu } from '../user/UserMenu'
import { ThemeToggle } from '../theme/ThemeToggle'

interface Props {
  user: User | null
  onLogout: () => void
}

export function DesktopHeader({ user, onLogout }: Props) {
  return (
    <header className="hidden md:flex h-16 items-center justify-between border-b px-4">
      <div className="font-bold">App</div>

      <DesktopNav />

      <div className="flex gap-2">
        <ThemeToggle/>
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}