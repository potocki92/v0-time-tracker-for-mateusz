'use client'

import { m, type MotionValue } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  capabilityStep,
  capabilityWindow,
  useCapabilityStepMotion,
  type ProgressWindow,
} from '../../../motion/capability'
import { CapabilityCard, type CapabilityCardProps } from '../CapabilityCard'

/**
 * Karta 05 — wymiana danych. Zamyka sekwencje, wiec jej chipy sa ostatnia
 * rzecza, ktora sekcja pokazuje.
 *
 * ── Dlaczego na liscie nie ma Stripe'a, Slacka ani Google Calendar ──
 *
 * Stara wersja bento obiecywala „Stripe SEPA · Google Cal · Slack · Linear ·
 * + 14 more". Zadna z tych integracji nie istnieje w repo i landing
 * swiadomie zerwal z zapowiedziami — ta sama zasada rzadzi sekcja
 * `EverythingElse`. Chipy nizej wskazuja WYLACZNIE wyjscia, ktore naprawde
 * da sie kliknac w aplikacji: `lib/export` (CSV, JSON), `@react-pdf/renderer`
 * (faktura i raport), import faktur z CSV i tygodniowy mail z `lib/email`.
 *
 * ── Stagger ──
 *
 * Chipy wchodza jeden po drugim, ale w pasmie wezszym niz cala karta i z
 * przesunieciem 6 px. To ma czytac sie jak uklada je ktos rownym ruchem, a
 * nie jak animacja wjazdu w prezentacji.
 */
const CHIP_KEYS = ['csv', 'pdf', 'json', 'csvImport', 'email'] as const

export function IntegrationsCard({ progress, profile, enter, reveal }: CapabilityCardProps) {
  const window = capabilityWindow('integrations', profile)

  return (
    <CapabilityCard
      cardKey="integrations"
      enter={enter}
      icon={<Share2 size={14} />}
      className="lg:col-span-4"
    >
      <ul className="flex flex-wrap gap-2">
        {reveal ? (
          <ChipsRevealed progress={progress} window={window} />
        ) : (
          CHIP_KEYS.map((key) => (
            <li key={key}>
              <Chip chipKey={key} />
            </li>
          ))
        )}
      </ul>
    </CapabilityCard>
  )
}

function Chip({ chipKey }: { chipKey: (typeof CHIP_KEYS)[number] }) {
  const t = useTranslations('marketing.capabilities.cards.integrations.chips')

  return <span className="lp-pill">{t(chipKey)}</span>
}

function RevealedChip({
  progress,
  window,
  chipKey,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  chipKey: (typeof CHIP_KEYS)[number]
}) {
  const step = useCapabilityStepMotion(progress, window, 6)

  return (
    <m.li className="lp-motion" style={{ opacity: step.opacity, transform: step.transform }}>
      <Chip chipKey={chipKey} />
    </m.li>
  )
}

/** Piec jawnych wywolan zamiast petli — hooki musza byc bezwarunkowe. */
function ChipsRevealed({
  progress,
  window,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
}) {
  const count = CHIP_KEYS.length
  const chip0 = capabilityStep(window, 0, count)
  const chip1 = capabilityStep(window, 1, count)
  const chip2 = capabilityStep(window, 2, count)
  const chip3 = capabilityStep(window, 3, count)
  const chip4 = capabilityStep(window, 4, count)

  return (
    <>
      <RevealedChip progress={progress} window={chip0} chipKey={CHIP_KEYS[0]} />
      <RevealedChip progress={progress} window={chip1} chipKey={CHIP_KEYS[1]} />
      <RevealedChip progress={progress} window={chip2} chipKey={CHIP_KEYS[2]} />
      <RevealedChip progress={progress} window={chip3} chipKey={CHIP_KEYS[3]} />
      <RevealedChip progress={progress} window={chip4} chipKey={CHIP_KEYS[4]} />
    </>
  )
}
