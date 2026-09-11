'use client'

import { useRef, type ReactNode } from 'react'
import { m, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'

import type { DemoMonth } from '../demo/demo-data'
import { AUTOMATION } from '../motion/automation-timeline'
import {
  revealKeyframes,
  useLayerFade,
  useScrollTransform,
  useTrackProgress,
  type LayerFade,
} from '../motion/scene'
import { MOTION_SHIFT_COPY, MOTION_SHIFT_LAYER } from '../motion/tokens'
import { AutomationCalendar } from './automation/AutomationCalendar'
import { PresenceBand } from './automation/PresenceBand'
import { WeekRules } from './automation/WeekRules'

/**
 * Automatyczne zapisywanie pracy — drugi duzy moment strony, po hero.
 *
 * ── Co sie zmienilo i dlaczego ──
 *
 * Poprzednia wersja pokazywala WSZYSTKO naraz: grafik, os obecnosci,
 * kalendarz, wynik i legende pominiec staly w jednym kadrze, kazde we wlasnej
 * karcie. Sekcja byla przez to poprawna i zupelnie nieczytelna — nic nie bylo
 * wazne, bo wazne bylo wszystko, a uzytkownik musial sam zlozyc z tego
 * zdanie.
 *
 * Teraz to jest HISTORIA W TRZECH KROKACH, a kazdy krok ma jedna mysl:
 *
 *   1. ustawiam zasady     → sam grafik tygodnia, duzy, na czerni,
 *   2. aplikacja wie, kiedy mnie nie ma → wchodzi os wyjazdow,
 *   3. kalendarz wypelnia sie sam → miesiac przejmuje ekran i zapisuje sie
 *      dzien po dniu, a na koncu pokazuje, ile z tego wyszlo.
 *
 * Cala arytmetyka okien stoi w `../motion/automation-timeline` — osobno, bo
 * jest arytmetyka, a nie stylem, i bo przesuniecie jednej granicy potrafi
 * cicho nasunac dwie warstwy na siebie. Test przejezdza ten tor punkt po
 * punkcie.
 *
 * ── Ile z tego jest prawda ──
 *
 * Wypelnienie NIE jest inscenizacja: dni policzyl `planDays` — ta sama czysta
 * funkcja, ktorej uzywa zadanie serwerowe automatu. Powody pominiecia
 * przychodza jako klucze domeny i tlumacza sie w warstwie UI.
 */
export function AutomationShowcase({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.automation')
  const trackRef = useRef<HTMLDivElement>(null)
  const progress = useTrackProgress(trackRef)

  // Trzy naglowki etapow leza na sobie i zmieniaja sie SEKWENCYJNIE: stary
  // gasnie, zanim zapali sie nowy. Tekst nie ma prawa przenikac przez tekst.
  const rulesCopy = useLayerFade(progress, ...AUTOMATION.rulesCopy, MOTION_SHIFT_COPY)
  const presenceCopy = useLayerFade(progress, ...AUTOMATION.presenceCopy, MOTION_SHIFT_COPY)
  const resultCopy = useLayerFade(progress, ...AUTOMATION.resultCopy, MOTION_SHIFT_COPY)

  // Dwie warstwy tresci: zasady (etapy 1-2) i kalendarz (etap 3).
  const rulesLayer = useLayerFade(progress, ...AUTOMATION.rulesLayer, MOTION_SHIFT_LAYER)
  const calendarLayer = useLayerFade(progress, ...AUTOMATION.calendarLayer, MOTION_SHIFT_LAYER)

  // Os obecnosci wchodzi w srodku pierwszej warstwy, a grafik nad nia
  // PODJEZDZA — zeby bylo widac, ze robi miejsce na nowa informacje, a nie
  // ze cos doklejono pod spodem.
  const presenceIn = revealKeyframes(AUTOMATION.presenceReveal, 0, 1)
  const presenceOpacity = useTransform(progress, presenceIn.stops, presenceIn.values)
  const presenceMove = revealKeyframes(
    AUTOMATION.presenceReveal,
    'translateY(20px)',
    'translateY(0px)',
  )
  const presenceTransform = useScrollTransform(progress, presenceMove.stops, presenceMove.values)
  const rulesLift = revealKeyframes(
    AUTOMATION.presenceReveal,
    'translateY(26px)',
    'translateY(0px)',
  )
  const rulesTransform = useScrollTransform(progress, rulesLift.stops, rulesLift.values)

  // Wynik miesiaca wchodzi dopiero, gdy siatka jest juz wypelniona — i ZOSTAJE
  // do konca toru, stad domkniete klatki (`revealKeyframes`).
  const outcome = revealKeyframes(AUTOMATION.result, 0, 1)
  const outcomeOpacity = useTransform(progress, outcome.stops, outcome.values)

  return (
    <section id="automation" aria-labelledby="automation-heading">
      <div ref={trackRef} className="lp-track lp-track-automation relative">
        <div className="lp-stage sticky top-0 flex h-[100svh] flex-col justify-center">
          <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
            <span className="lp-eyebrow">{t('eyebrow')}</span>

            {/*
              Naglowek etapu 1 jest JEDYNYM `h2` sekcji: to on niesie jej teze
              i jej dostepna nazwe. Etapy 2 i 3 dopowiadaja te sama mysl, wiec
              sa akapitami — inaczej sekcja miala by trzy naglowki tego samego
              poziomu, a czytnik ekranu trzy wpisy w konspekcie.
            */}
            <div className="lp-layers mt-4 sm:mt-5">
              <StageCopy fade={rulesCopy}>
                <h2 id="automation-heading" className="lp-display lp-d2 max-w-[17ch]">
                  {t('heading')}
                </h2>
              </StageCopy>
              <StageCopy fade={presenceCopy}>
                <p className="lp-display lp-d2 max-w-[17ch]">{t('stagePresence')}</p>
              </StageCopy>
              <StageCopy fade={resultCopy}>
                <p className="lp-display lp-d2 max-w-[17ch]">{t('stageResult')}</p>
              </StageCopy>
            </div>

            <div className="lp-layers mt-8 sm:mt-12">
              <m.div
                className="lp-layer flex flex-col justify-center"
                style={{
                  opacity: rulesLayer.opacity,
                  transform: rulesLayer.transform,
                  visibility: rulesLayer.visibility,
                }}
              >
                <m.div className="lp-motion" style={{ transform: rulesTransform }}>
                  <WeekRules />
                </m.div>
                <m.div
                  className="lp-motion mt-8 sm:mt-12"
                  style={{ opacity: presenceOpacity, transform: presenceTransform }}
                >
                  <PresenceBand />
                </m.div>
              </m.div>

              <m.div
                className="lp-layer flex flex-col justify-center"
                style={{
                  opacity: calendarLayer.opacity,
                  transform: calendarLayer.transform,
                  visibility: calendarLayer.visibility,
                }}
              >
                <AutomationCalendar
                  month={month}
                  progress={progress}
                  outcomeOpacity={outcomeOpacity}
                />
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Jeden naglowek etapu w stosie warstw — sam transport wartosci, zero ukladu. */
function StageCopy({ fade, children }: { fade: LayerFade; children: ReactNode }) {
  return (
    <m.div
      className="lp-layer"
      style={{ opacity: fade.opacity, transform: fade.transform, visibility: fade.visibility }}
    >
      {children}
    </m.div>
  )
}
