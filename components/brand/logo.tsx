import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export const BRAND = {
  name: 'WorkFlow Pro',
  tagline: 'Rejestr czasu pracy',
  homeHref: '/',
} as const

const LOGO_SRC = '/logo.png'
const LOGO_INTRINSIC = { width: 1024, height: 1536 } as const

const sizeHeightClass = {
  sm: 'h-4',
  md: 'h-8',
  lg: 'h-16',
  xl: 'h-24',
} as const

export type LogoSize = keyof typeof sizeHeightClass

interface LogoProps {
  size?: LogoSize
  /** If provided, the logo is wrapped in a Next.js <Link>. */
  href?: string
  /** Hint next/image to preload. Set on above-the-fold logos. */
  priority?: boolean
  /** Extra classes applied to the image. */
  className?: string
  /** Accessible name. Defaults to brand name. */
  label?: string
}

export function Logo({
  size = 'md',
  href,
  priority,
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
      className={cn(sizeHeightClass[size], 'w-auto select-none', className)}
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
