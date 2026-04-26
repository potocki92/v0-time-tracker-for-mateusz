'use client'

import Link from 'next/link'
import { LogOut, Settings, User, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
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
  const { theme, setTheme } = useTheme()

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const themeLabel =
    theme === 'dark' ? 'Tryb ciemny' : theme === 'light' ? 'Tryb jasny' : 'Tryb systemowy'

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Avatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            initials={initials}
            avatarClassName="size-8 rounded-full"
            fallbackClassName="bg-muted text-xs"
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

      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          <ThemeIcon className="h-4 w-4" />
          {themeLabel}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
              <Sun className="h-4 w-4" /> Jasny
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
              <Moon className="h-4 w-4" /> Ciemny
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
              <Monitor className="h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Wyloguj
      </DropdownMenuItem>
    </>
  )
}
