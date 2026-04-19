'use client'

import { User } from 'lucide-react'
import {
  Avatar as UiAvatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'

interface AvatarProps {
  avatarUrl?: string
  displayName: string
  initials: string
  className?: string
  fallbackClassName?: string
  showIconFallback?: boolean
}

export function Avatar({
  avatarUrl,
  displayName,
  initials,
  className,
  fallbackClassName,
  showIconFallback = false,
}: AvatarProps) {
  return (
    <UiAvatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
      <AvatarFallback className={fallbackClassName}>
        {initials || (showIconFallback ? <User className="h-4 w-4" /> : 'U')}
      </AvatarFallback>
    </UiAvatar>
  )
}
