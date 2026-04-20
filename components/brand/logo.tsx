import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const BRAND = {
  name: 'WorkFlow Pro',
  tagline: 'Rejestr czasu pracy',
  homeHref: '/',
} as const

const LOGO_SRC = '/icon.svg'
const LOGO_INTRINSIC = { width: 180, height: 180 } as const

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<LogoSize, string> = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-12 sm:size-14',
  xl: 'size-16 sm:size-20 md:size-24',
}

const SIZE_HINT: Record<LogoSize, string> = {
  sm: '24px',
  md: '32px',
  lg: '(max-width: 640px) 48px, 56px',
  xl: '(max-width: 640px) 64px, (max-width: 768px) 80px, 96px',
}

interface LogoProps {
  href?:      string
  priority?:  boolean
  size?:      LogoSize
  className?: string
  label?:     string
}

export function Logo({
  href,
  priority,
  size = 'md',
  className,
  label = BRAND.name,
}: LogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt={href ? '' : label}
      width={LOGO_INTRINSIC.width}
      height={LOGO_INTRINSIC.height}
      priority={priority}
      sizes={SIZE_HINT[size]}
      className={cn(SIZE_CLASSES[size], 'object-contain select-none', className)}
    />
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className="inline-flex items-center rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {image}
      </Link>
    )
  }

  return image
}
