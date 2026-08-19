'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'

import { BrandMark } from '../../components/BrandMark'
import { NAV_LINKS } from './data'

interface LandingNavbarSectionProps {
  isAuthenticated: boolean
}

export function LandingNavbarSection({ isAuthenticated }: LandingNavbarSectionProps) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background .3s ease, border-color .3s ease, backdrop-filter .3s ease',
        borderBottom: `1px solid ${scrolled ? 'var(--hair)' : 'transparent'}`,
        background: scrolled ? 'rgba(6,7,9,.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(140%)' : 'none',
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 sm:px-8">
        <Link href="#top" className="group">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="nav-link">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="em-hover hidden items-center gap-1.5 text-xs sm:inline-flex"
          >
            Sign in <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a href="#cta" className="cta-primary !px-3.5 !py-2 !text-xs">
            Start free <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md md:hidden"
            style={{
              color: 'var(--ink-2)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="border-t md:hidden"
          style={{ borderColor: 'var(--hair)', background: 'rgba(6,7,9,.95)' }}
        >
          <nav className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  color: 'var(--ink-2)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
            <div
              className="mt-2 flex flex-col gap-2 border-t pt-3"
              style={{ borderColor: 'var(--hair)' }}
            >
              {isAuthenticated ? (
                <a href="/dashboard" className="cta-primary justify-center">
                  Open app <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <>
                  <a href="/auth/login" className="cta-ghost justify-center">
                    Sign in
                  </a>
                  <a href="#cta" className="cta-primary justify-center">
                    Start free <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
