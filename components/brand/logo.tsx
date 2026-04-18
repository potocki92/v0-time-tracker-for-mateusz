import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const BRAND = {
  name: 'WorkFlow Pro',
  tagline: 'Rejestr czasu pracy',
  homeHref: '/',
} as const

const LOGO_SRC = '/logo.png'
const LOGO_INTRINSIC = { width: 1024, height: 1536 } as const

const markHeightClass = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
} as const

const wordmarkVariants = cva('font-semibold tracking-tight whitespace-nowrap', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
  },
  defaultVariants: { size: 'md' },
})

const containerGaps = {
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-3',
  xl: 'gap-3',
} as const

type LogoSize = NonNullable<VariantProps<typeof wordmarkVariants>['size']>

interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** What to render. `icon` = mark only, `wordmark` = text only, `full` = both. */
  variant?: 'icon' | 'wordmark' | 'full'
  size?: LogoSize
  /** If provided, the logo is wrapped in a Next.js <Link>. Use `/` in navbars. */
  href?: string
  /** Hint next/image to preload. Set on above-the-fold logos (auth pages, hero). */
  priority?: boolean
  /** Override mark (image) classes. */
  markClassName?: string
  /** Override wordmark (text) classes. */
  textClassName?: string
  /** Accessible name for the whole logo. Defaults to brand name. */
  label?: string
}

export function Logo({
  variant = 'full',
  size = 'md',
  href,
  priority,
  className,
  markClassName,
  textClassName,
  label = BRAND.name,
  ...rest
}: LogoProps) {
  const showMark = variant !== 'wordmark'
  const showText = variant !== 'icon'

  const content = (
    <>
      {showMark && (
        <Image
          src={LOGO_SRC}
          alt=""
          width={LOGO_INTRINSIC.width}
          height={LOGO_INTRINSIC.height}
          priority={priority}
          className={cn(markHeightClass[size], 'w-auto select-none', markClassName)}
        />
      )}
      {showText && (
        <span className={cn(wordmarkVariants({ size }), textClassName)}>
          {BRAND.name}
        </span>
      )}
    </>
  )

  const baseClasses = cn(
    'inline-flex items-center',
    containerGaps[size],
    className,
  )

  if (href) {
    return (
      <Link
        {...(rest as React.ComponentProps<typeof Link>)}
        href={href}
        aria-label={label}
        className={cn(
          baseClasses,
          'rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <span role="img" aria-label={label} className={baseClasses} {...rest}>
      {content}
    </span>
  )
}
