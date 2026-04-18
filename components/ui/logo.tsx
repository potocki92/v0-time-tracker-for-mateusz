import * as React from 'react'
import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const BRAND = {
  name: 'WorkFlow Pro',
  tagline: 'Rejestr czasu pracy',
  homeHref: '/',
} as const

const markVariants = cva(
  'inline-flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25',
  {
    variants: {
      size: {
        sm: 'size-7 rounded-lg [&>svg]:size-4',
        md: 'size-9 rounded-xl [&>svg]:size-5',
        lg: 'size-12 rounded-2xl [&>svg]:size-6',
        xl: 'size-16 rounded-2xl [&>svg]:size-8',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

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

type LogoSize = NonNullable<VariantProps<typeof markVariants>['size']>

interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** What to render. `icon` = mark only, `wordmark` = text only, `full` = both. */
  variant?: 'icon' | 'wordmark' | 'full'
  size?: LogoSize
  /** If provided, the logo is wrapped in a Next.js <Link>. Use `/` in navbars. */
  href?: string
  /** Override mark styles (e.g. disable shadow in a dense header). */
  markClassName?: string
  /** Override wordmark styles (e.g. custom color in a hero). */
  textClassName?: string
  /** Accessible name for the whole logo. Defaults to brand name. */
  label?: string
}

function ClockMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  href,
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
        <span className={cn(markVariants({ size }), markClassName)}>
          <ClockMark />
        </span>
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
