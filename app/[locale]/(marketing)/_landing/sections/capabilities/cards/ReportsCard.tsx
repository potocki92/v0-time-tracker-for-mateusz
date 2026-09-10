'use client'

import type { CSSProperties } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

import { useFormat } from '@/lib/format/client'

import { DEMO_MONTHLY_HOURS } from '../../../demo/demo-data'
import {
  capabilityStep,
  capabilityWindow,
  useCapabilityBarMotion,
  type ProgressWindow,
} from '../../../motion/capability'
import { CapabilityCard, type CapabilityCardProps } from '../CapabilityCard'

/**
 * Karta 04 — raporty. Szesc miesiecy godzin, slupek po slupku.
 *
 * ── Dlaczego slupki NIE rosna wysokoscia ──
 *
 * Stara implementacja bento animowala `height: 0 → 84%`. Kazda klatka takiej
 * animacji to przeliczenie ukladu i ponowne malowanie calego wiersza — na
 * telefonie najdrozsza rzecz, jaka mozna wsadzic w klatke przewijania, i
 * pierwsza zasada z `docs/landing-motion.md`.
 *
 * Tutaj slupek ma swoja DOCELOWA wysokosc od pierwszej klatki: siedzi ona w
 * zmiennej CSS `--lp-bar`, ustawianej raz, przy renderze. Wzrost robi
 * wylacznie `scaleY(0) → scaleY(1)` z `transform-origin: bottom`
 * (`landing.css`), czyli transformacja kompozytora, ktora nie dotyka ukladu.
 *
 * Efekt uboczny, ktory trzeba znac: `scaleY` sciska tez zaokraglenie rogow.
 * Przy promieniu 2 px jest to niewidoczne — przy wiekszym trzeba by
 * skalowac wnetrze, nie sam slupek.
 */
export function ReportsCard({ progress, profile, enter, reveal }: CapabilityCardProps) {
  const fmt = useFormat()
  const window = capabilityWindow('reports', profile)
  const max = Math.max(...DEMO_MONTHLY_HOURS.map((entry) => entry.hours))

  return (
    <CapabilityCard
      cardKey="reports"
      enter={enter}
      icon={<BarChart3 size={14} />}
      className="lg:col-span-4"
    >
      {/* Wykres powtarza to, co mowi zdanie nad nim — dla czytnika ekranu
          jest wiec dekoracja, a nie szescioma bezimiennymi liczbami. */}
      <div aria-hidden className="max-w-[300px]">
        <div className="flex h-[80px] items-end gap-1.5">
          {reveal ? (
            <BarsRevealed progress={progress} window={window} max={max} />
          ) : (
            DEMO_MONTHLY_HOURS.map((entry, index) => (
              <span
                key={entry.month}
                className={barClass(index)}
                style={barHeight(entry.hours, max)}
              />
            ))
          )}
        </div>

        <div className="mt-1.5 flex gap-1.5">
          {DEMO_MONTHLY_HOURS.map((entry) => (
            <span key={entry.month} className="flex-1 text-center lp-t8 text-zinc-500">
              {fmt.monthName(entry.month, 'short')}
            </span>
          ))}
        </div>
      </div>
    </CapabilityCard>
  )
}

/** Ostatni slupek to miesiac biezacy — ten sam sygnal, co „teraz" na Pulpicie. */
function barClass(index: number): string {
  const accent = index === DEMO_MONTHLY_HOURS.length - 1
  return `lp-cap-bar min-w-0 flex-1 ${accent ? 'lp-cap-bar-accent' : ''}`
}

/**
 * Docelowa wysokosc slupka. Jedzie zmienna CSS, a nie kluczem `height`, zeby
 * bylo widac na pierwszy rzut oka, ze to wartosc USTAWIANA RAZ — nic, co
 * animuje sie w trakcie przewijania.
 */
function barHeight(hours: number, max: number): CSSProperties {
  return { ['--lp-bar']: `${Math.round((hours / max) * 100)}%` } as CSSProperties
}

function RevealedBar({
  progress,
  window,
  index,
  max,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  index: number
  max: number
}) {
  const entry = DEMO_MONTHLY_HOURS[index]
  const bar = useCapabilityBarMotion(progress, window)

  return (
    <m.span
      className={`lp-motion ${barClass(index)}`}
      style={{ ...barHeight(entry.hours, max), opacity: bar.opacity, transform: bar.transform }}
    />
  )
}

/**
 * Szesc jawnych wywolan zamiast petli — hooki musza byc bezwarunkowe.
 * `DEMO_MONTHLY_HOURS` ma szesc pozycji i test tej sekcji tego pilnuje.
 */
function BarsRevealed({
  progress,
  window,
  max,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  max: number
}) {
  const count = DEMO_MONTHLY_HOURS.length
  const bar0 = capabilityStep(window, 0, count)
  const bar1 = capabilityStep(window, 1, count)
  const bar2 = capabilityStep(window, 2, count)
  const bar3 = capabilityStep(window, 3, count)
  const bar4 = capabilityStep(window, 4, count)
  const bar5 = capabilityStep(window, 5, count)

  return (
    <>
      <RevealedBar progress={progress} window={bar0} index={0} max={max} />
      <RevealedBar progress={progress} window={bar1} index={1} max={max} />
      <RevealedBar progress={progress} window={bar2} index={2} max={max} />
      <RevealedBar progress={progress} window={bar3} index={3} max={max} />
      <RevealedBar progress={progress} window={bar4} index={4} max={max} />
      <RevealedBar progress={progress} window={bar5} index={5} max={max} />
    </>
  )
}
