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
    <div
      className={cn(
        'group sticky top-0 rounded-full bg-background/35 p-[3px] backdrop-blur-[8px] shadow-avatar-ring shadow-avatar-outer',
        className,
      )}
    >
      <UiAvatar
        className={cn(
          'size-14 rounded-full transition-transform duration-300 ease-out',
          avatarClassName,
        )}
      >
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={displayName}
            className="rounded-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        ) : null}
        <AvatarFallback className={cn('text-sm font-semibold', fallbackClassName)}>
          {initials || (showIconFallback ? <User className="h-4 w-4" /> : 'U')}
        </AvatarFallback>
      </UiAvatar>
    </div>
  )
}
