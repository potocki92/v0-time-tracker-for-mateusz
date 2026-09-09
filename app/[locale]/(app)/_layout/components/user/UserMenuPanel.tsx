'use client'

import { LogOut, Settings, User, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
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
import { Link } from '@/i18n/navigation'
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
  const t = useTranslations('navigation.userMenu')
  const openModal = useOpenModal()
  const { theme, setTheme } = useTheme()

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const themeLabel =
    theme === 'dark'
      ? t('theme.modeDark')
      : theme === 'light'
        ? t('theme.modeLight')
        : t('theme.modeSystem')

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
        {t('settings')}
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link href="/profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {t('profile')}
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
              <Sun className="h-4 w-4" /> {t('theme.light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
              <Moon className="h-4 w-4" /> {t('theme.dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
              <Monitor className="h-4 w-4" /> {t('theme.system')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        {t('logout')}
      </DropdownMenuItem>
    </>
  )
}
