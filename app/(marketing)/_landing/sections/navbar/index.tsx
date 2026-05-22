'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, ArrowUpRight } from 'lucide-react'

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
        <Link href="#top" className="flex items-center gap-2.5 group">
          <div
            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-[8px] hair-strong"
            style={{ background: 'linear-gradient(135deg,#0F1A12,#000)' }}
          >
            <div className="absolute inset-0 flex items-end justify-center gap-[3px] p-1.5">
              <span className="h-[6px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
              <span className="h-[10px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
              <span className="h-[14px] w-[3px] rounded-[1.5px] bg-[#22E07A]" />
            </div>
          </div>
          <span className="text-[14px] font-semibold tracking-tight">TimeTracker</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: '#product', label: 'Product' },
            { href: '#flow', label: 'How it works' },
            { href: '#pricing', label: 'Pricing' },
            { href: '#customers', label: 'Customers' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                color: 'var(--ink-2)',
                fontSize: 13,
                padding: '8px 12px',
                borderRadius: 8,
                transition: 'color .2s ease, background .2s ease',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = 'var(--ink-1)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.03)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = 'var(--ink-2)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="hidden items-center gap-1.5 text-[13px] em-hover sm:inline-flex"
          >
            Sign in <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a href="#cta" className="cta-primary !py-2 !px-3.5 !text-[12.5px]">
            Start free <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md md:hidden"
            style={{ color: 'var(--ink-2)', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
            {[
              { href: '#product', label: 'Product' },
              { href: '#flow', label: 'How it works' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#customers', label: 'Customers' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{ color: 'var(--ink-2)', padding: '10px 12px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}
              >
                {label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'var(--hair)' }}>
              {isAuthenticated ? (
                <a href="/dashboard" className="cta-primary justify-center">
                  Open app <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <>
                  <a href="/auth/login" className="cta-ghost justify-center">Sign in</a>
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
