'use client'

import Link from 'next/link'
import { LogOut, Settings, User } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useOpenModal } from '@/hooks/stores/useUiStore'
import { Avatar } from './Avatar'

interface UserMenuPanelProps {
  displayName: string
  email: string
  avatarUrl?: string
  initials: string
  onLogout: () => void
}

export function UserMenuPanel({
  displayName,
  email,
  avatarUrl,
  initials,
  onLogout,
}: UserMenuPanelProps) {
  const openModal = useOpenModal()

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Avatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            initials={initials}
            className="rounded-lg p-[2px]"
            avatarClassName="size-8 rounded-lg"
            fallbackClassName="rounded-lg bg-muted text-xs"
          />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </div>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => openModal('settings')}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Ustawienia
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link href="/profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profil
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Wyloguj
      </DropdownMenuItem>
    </>
  )
}
