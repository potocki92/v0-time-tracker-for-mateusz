'use client'

import { m, type MotionValue } from 'framer-motion'
import { Pause, Play, Square, Timer } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useDemoNames } from '../../../demo/useDemoNames'
import {
  capabilityStep,
  capabilityWindow,
  useCapabilityGlowMotion,
  useCapabilityStepMotion,
  type ProgressWindow,
} from '../../../motion/capability'
import { CapabilityCard, type CapabilityCardProps } from '../CapabilityCard'
import { formatElapsed, useTickingClock } from '../useTickingClock'

/**
 * Karta 01 — tracker. Otwiera sekwencje, wiec dostaje najszersze pole w
 * bento i jedyny w tej sekcji element interaktywny.
 *
 * Ruch ma tu trzy niezalezne zrodla i to jest celowe:
 *  1. ramka karty — scroll (`CapabilityCard`),
 *  2. panel licznika — scroll, z opoznieniem wzgledem ramki (`capabilityStep`),
 *  3. same cyfry — wlasny zegar 1 Hz, kompletnie odciety od przewijania.
 *
 * Trzeciego nie wolno zlaczyc z pierwszymi dwoma: licznik, ktory przyspiesza
 * pod palcem, przestaje byc dowodem na to, ze tracker dziala.
 */
export function TrackerCard({ progress, profile, enter, reveal }: CapabilityCardProps) {
  const window = capabilityWindow('tracker', profile)

  return (
    <CapabilityCard
      cardKey="tracker"
      enter={enter}
      icon={<Timer size={14} />}
      className="lg:col-span-7"
    >
      {/* Poswiata lezy POD trescia i pozycjonuje sie wzgledem `.lp-capability`
          (jedyny `relative` przodek), wiec nie potrzebuje wlasnego slotu. */}
      {reveal ? <TrackerGlow progress={progress} /> : <span aria-hidden className="lp-cap-orb" />}

      {reveal ? (
        <TrackerPanelReveal progress={progress} window={window} />
      ) : (
        <TrackerPanel />
      )}
    </CapabilityCard>
  )
}

function TrackerGlow({ progress }: { progress: MotionValue<number> }) {
  const transform = useCapabilityGlowMotion(progress)

  return <m.span aria-hidden className="lp-motion lp-cap-orb" style={{ transform }} />
}

function TrackerPanelReveal({
  progress,
  window,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
}) {
  // Panel to jeden krok na cala karte: naglowek i opis wchodza z ramka,
  // licznik chwile po nich.
  const step = useCapabilityStepMotion(progress, capabilityStep(window, 0, 1), 10)

  return (
    <m.div
      className="lp-motion"
      style={{ opacity: step.opacity, transform: step.transform }}
    >
      <TrackerPanel />
    </m.div>
  )
}

/**
 * Panel licznika. Trzyma stan zegara, wiec to TUTAJ konczy sie sekundowy
 * render — ramka karty i jej wartosci sterowane scrollem sa wyzej i nie
 * przerysowuja sie ani razu na sekunde.
 */
function TrackerPanel() {
  const t = useTranslations('marketing.capabilities.cards.tracker')
  const names = useDemoNames()
  const { seconds, running, toggle, stop } = useTickingClock()

  return (
    <div className="lp-cap-timer inline-flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className={running ? 'lp-cap-dot lp-cap-dot-live' : 'lp-cap-dot'} />
        <span className="lp-t11 text-[var(--lp-ink-2)]">
          {t(running ? 'running' : 'paused')} · {names.site}
        </span>
      </div>

      <p className="lp-cap-clock lp-mono tabular-nums">
        {formatElapsed(seconds)}
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={toggle} className="lp-cap-btn">
          {running ? <Pause size={12} aria-hidden /> : <Play size={12} aria-hidden />}
          {t(running ? 'pause' : 'resume')}
        </button>
        <button type="button" onClick={stop} className="lp-cap-btn">
          <Square size={12} aria-hidden />
          {t('stop')}
        </button>
      </div>
    </div>
  )
}
