'use client'

import { User } from 'lucide-react'
import {
  Avatar as UiAvatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarProps {
  avatarUrl?: string
  displayName: string
  initials: string
  className?: string
  fallbackClassName?: string
  avatarClassName?: string
  showIconFallback?: boolean
}

export function Avatar({
  avatarUrl,
  displayName,
  initials,
  className,
  fallbackClassName,
  avatarClassName,
  showIconFallback = false,
}: AvatarProps) {
  return (
    <UiAvatar
      className={cn(
        'size-8 rounded-full shadow-[var(--shadow-avatar-ring)]',
        avatarClassName,
        className,
      )}
    >
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={displayName} className="rounded-full object-cover" />
      ) : null}
      <AvatarFallback
        className={cn('text-xs font-semibold uppercase', fallbackClassName)}
      >
        {initials || (showIconFallback ? <User className="size-4" /> : 'U')}
      </AvatarFallback>
    </UiAvatar>
  )
}
