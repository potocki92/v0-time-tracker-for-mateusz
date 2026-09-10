'use client'

import type { ReactNode } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { CapabilityMotion } from '../../motion/capability'
import type { MotionProfile } from '../../motion/profile'

/**
 * Kontrakt wspolny dla piatki kart.
 *
 * `reveal` mowi, czy TRESC karty ma wchodzic osobno od jej ramki. Jest
 * wlaczony wylacznie na desktopie bez ograniczenia ruchu, a decyzje
 * podejmuje sekcja — karta jej nie powtarza. Powod stoi w
 * `CapabilityCards.tsx` i w `docs/landing-motion.md`.
 */
export interface CapabilityCardProps {
  progress: MotionValue<number>
  profile: MotionProfile
  /**
   * Ruch RAMKI karty, policzony raz w sekcji. Nazwa celowo nie brzmi
   * `motion`: `motion.*` to w tym repo proxy Motion, ktorego nie wolno
   * uzywac pod `LazyMotion strict` (`__test__/config/bundle-hygiene.test.ts`).
   */
  enter: CapabilityMotion
  reveal: boolean
}

/**
 * Ramka karty mozliwosci — jedyne miejsce, w ktorym scroll dotyka tej karty.
 *
 * ── Dwa wezly zamiast jednego ──
 *
 * `m.article` niesie ruch sterowany przewijaniem (inline `transform` od
 * Motion), a `div.lp-capability` w srodku — hover. To nie jest nadmiarowy
 * element: `transform` istnieje na wezle RAZ, wiec gdyby hover i scroll
 * siedzialy na tym samym elemencie, styl inline z Motion po prostu
 * skasowalby hover z CSS. Rozdzielenie oznacza tez, ze hover jest zwyklym
 * przejsciem CSS i nie kosztuje ani jednej wartosci JavaScriptu.
 *
 * `lp-motion` to zaczep dla `@media (prefers-reduced-motion: reduce)` w
 * `landing.css`: tam karta dostaje `opacity: 1 !important` i `transform:
 * none !important`, ktore bija zarowno styl inline, jak i animacje WAAPI.
 * Landing ma JEDEN mechanizm ograniczania ruchu i to jest ten mechanizm.
 */
export function CapabilityCard({
  cardKey,
  enter,
  icon,
  className = '',
  children,
}: {
  cardKey: string
  enter: CapabilityMotion
  icon: ReactNode
  /** Miejsce karty w siatce bento — sam uklad, zero stylu powierzchni. */
  className?: string
  /** Wizualizacja karty. Naglowek sklada sie tutaj, bo jest wspolny dla piatki. */
  children: ReactNode
}) {
  const t = useTranslations('marketing.capabilities.cards')

  return (
    <m.article
      className={`lp-motion ${className}`}
      style={{ opacity: enter.opacity, transform: enter.transform }}
    >
      <div className="lp-capability relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-[var(--lp-accent)]">
            {icon}
          </span>
          <span className="lp-cap-label">{t(`${cardKey}.label`)}</span>
        </div>

        <h3 className="mt-2 text-base font-semibold leading-snug text-white sm:text-lg">
          {t(`${cardKey}.title`)}
        </h3>
        <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-[var(--lp-ink-2)]">
          {t(`${cardKey}.body`)}
        </p>

        {/* `mt-auto`: wizualizacje wszystkich kart w wierszu stoja na tej
            samej linii, niezaleznie od dlugosci opisu w danym jezyku. */}
        <div className="mt-auto pt-5">{children}</div>
      </div>
    </m.article>
  )
}
