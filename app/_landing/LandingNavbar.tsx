'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Logo, BRAND } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LandingNavbarProps {
  isAuthenticated: boolean
}

const NAV_LINKS = [
  { href: '#funkcje', label: 'Funkcje' },
  { href: '#jak-dziala', label: 'Jak to działa' },
  { href: '#korzysci', label: 'Korzyści' },
  { href: '#faq', label: 'FAQ' },
] as const

export function LandingNavbar({ isAuthenticated }: LandingNavbarProps) {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            {BRAND.name}
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Główna nawigacja">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Przejdź do panelu</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Zaloguj się</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Wypróbuj za darmo</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          id="landing-mobile-menu"
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobilna nawigacja">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/90 hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {isAuthenticated ? (
                <Button asChild>
                  <Link href="/dashboard">Przejdź do panelu</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/auth/login">Zaloguj się</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/sign-up">Wypróbuj za darmo</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
