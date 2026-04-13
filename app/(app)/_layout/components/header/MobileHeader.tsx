'use client'

import { ThemeToggle } from '../theme/ThemeToggle'
import { UserMenu } from '../user/UserMenu'
import type { User } from '@supabase/supabase-js'
import { Logo } from './Logo'

interface Props {
  user: User | null
  onLogout: () => void
}

export function MobileHeader({ user, onLogout }: Props) {
  return (
    <header className="md:hidden flex h-14 items-center justify-between border-b px-4">
      <Logo />

      <div className="flex gap-1">
        <ThemeToggle />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}