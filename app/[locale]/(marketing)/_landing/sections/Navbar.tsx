'use client'

import { useState } from 'react'
import { m, useMotionValueEvent, useScroll } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { Link } from '@/i18n/navigation'

import { useScrollMap } from '../motion/scene'

/** Kotwice w obrebie strony — hash nie ma wersji jezykowej, etykieta ma. */
const ANCHORS = [
  { key: 'product', href: '#product' },
  { key: 'automation', href: '#automation' },
  { key: 'flow', href: '#flow' },
] as const

/**
 * Navbar: logo, trzy kotwice, przelacznik jezyka, dwie akcje.
 *
 * Tlo i obrys jada na MotionValue (zero rerenderow), a `backdrop-filter`
 * wchodzi dopiero po przekroczeniu progu — jako klasa, nie jako animowana
 * wlasciwosc. Animowany blur to najdrozsza rzecz, jaka mozna wpisac do
 * przyklejonego paska.
 */
export function Navbar() {
  const t = useTranslations('marketing.nav')
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  const background = useScrollMap(scrollY, [0, 80], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)'])
  const borderColor = useScrollMap(
    scrollY,
    [0, 80],
    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)'],
  )

  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 24))

  return (
    <m.header
      className={`fixed inset-x-0 top-0 z-50 border-b ${scrolled ? 'backdrop-blur-md' : ''}`}
      style={{ background, borderColor }}
    >
      <nav
        aria-label={t('aria')}
        className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-5 sm:px-8"
      >
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="size-4 rounded-[5px] bg-[var(--lp-accent)]" />
          <span className="lp-t13 font-semibold tracking-tight">TimeTracker</span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {ANCHORS.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="rounded-lg px-3 py-2 lp-t13 text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-ink-1)]"
            >
              {t(anchor.key)}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <Link
            href="/auth/login"
            className="rounded-lg px-3 py-2 lp-t13 text-[var(--lp-ink-2)] transition-colors hover:text-[var(--lp-ink-1)]"
          >
            {t('signIn')}
          </Link>
          <Link href="/dashboard" className="lp-cta !min-h-9 !px-4 !lp-t13">
            {t('openApp')}
          </Link>
        </div>
      </nav>
    </m.header>
  )
}
