'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Logo, BRAND } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

import { NavbarActions } from './NavbarActions'
import { NavbarLinks } from './NavbarLinks'
import { useLandingNavbarState } from './useLandingNavbarState'

interface LandingNavbarSectionProps {
  isAuthenticated: boolean
}

export function LandingNavbarSection({ isAuthenticated }: LandingNavbarSectionProps) {
  const { open, scrolled, setOpen } = useLandingNavbarState()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        scrolled
          ? 'border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70'
          : 'border-transparent bg-background/0',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo href="/" size="md" priority />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">{BRAND.name}</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Główna nawigacja">
          <NavbarLinks />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <NavbarActions isAuthenticated={isAuthenticated} />
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="landing-mobile-menu" className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobilna nawigacja">
            <NavbarLinks mobile onNavigate={() => setOpen(false)} />
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <NavbarActions isAuthenticated={isAuthenticated} mobile />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
