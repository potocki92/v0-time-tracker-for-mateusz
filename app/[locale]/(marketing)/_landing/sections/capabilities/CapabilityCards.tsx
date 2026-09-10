'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'

import type { DemoMonth } from '../../demo/demo-data'
import { useCapabilityCardMotion } from '../../motion/capability'
import { useMotionProfile, usePrefersReducedMotion } from '../../motion/profile'
import { useEntryProgress } from '../../motion/scene'
import { CalendarCard } from './cards/CalendarCard'
import { IntegrationsCard } from './cards/IntegrationsCard'
import { InvoicesCard } from './cards/InvoicesCard'
import { ReportsCard } from './cards/ReportsCard'
import { TrackerCard } from './cards/TrackerCard'

/**
 * „Mozliwosci" — piec kart na JEDNYM postepie przewijania.
 *
 * ── Czym ta sekcja rozni sie od trzech pozostalych scen ──
 *
 * `ProductJourney`, `NumbersStory` i `AutomationShowcase` stoja na
 * PRZYKLEJONYM torze: strona zatrzymuje sie, a scena gra na miejscu. Tutaj
 * nic sie nie zatrzymuje — karty leza w normalnym przeplywie i skladaja sie
 * w miare, jak wjezdzaja na ekran. To swiadoma roznica, nie niedorobka:
 * przyklejenie piatki kart wymagaloby albo zmieszczenia ich wszystkich na
 * jednym ekranie telefonu (nie mieszcza sie), albo drugiego mechanizmu
 * „jedna karta naraz" — czyli przepisania tej sekcji na `ProductJourney`.
 *
 * Wspolne z tamtymi scenami zostaje to, co decyduje o wrazeniu i o koszcie:
 * jedno zrodlo postepu na cala sekcje, zero listenerow `scroll`, zero
 * postepu w stanie Reacta, `opacity` i gotowy `transform` jako jedyne
 * animowane wlasciwosci.
 *
 * ── Skad sie biora zakresy ──
 *
 * `useEntryProgress` mierzy SIATKE KART, nie cala sekcje: dzieki temu `p`
 * znaczy „taki ulamek siatki jest juz nad dolna krawedzia ekranu", a okna z
 * `motion/capability.ts` czyta sie jak pozycje kart w ukladzie. Naglowek
 * sekcji stoi poza torem, bo nie animuje sie razem z kartami.
 *
 * ── Desktop kontra telefon ──
 *
 * Ponizej `lg` siatka ma JEDNA kolumne. To nie jest tylko zwezenie ukladu:
 * jedna kolumna znaczy piec osobnych taktow (kazda karta ma wlasna
 * glebokosc), wiec timeline mobilny jest naprawde sekwencyjny. Uklad
 * dwukolumnowy w pasmie 640-1023 px dawalby trzy wiersze, czyli TRZECI
 * uklad do wystrojenia przy dwoch profilach ruchu.
 *
 * Na telefonie scroll prowadzi wylacznie RAMKI kart (piec wartosci na cala
 * sekcje). Tresc w srodku stoi gotowa. Powod jest ten sam, dla ktorego
 * `MonthGrid` animuje tam tygodniami zamiast dniami: druga, zagniezdzona
 * animacja pod palcem na ekranie o szerokosci 390 px nie dodaje informacji,
 * a mnozy zapisy stylu w klatce przewijania. Na desktopie tresc dostaje
 * wlasne, opoznione wejscie (`reveal`).
 */
export function CapabilityCards({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.capabilities')
  const profile = useMotionProfile()
  const reduceMotion = usePrefersReducedMotion()
  const gridRef = useRef<HTMLDivElement>(null)
  const progress = useEntryProgress(gridRef)

  /*
    Ruch wewnatrz kart tylko na desktopie i tylko bez ograniczenia ruchu.
    Przy `prefers-reduced-motion` `landing.css` i tak zeruje ten ruch przez
    `!important`, ale wartosci nadal przeliczalyby sie w kazdej klatce
    przewijania — a to praca za nic dokladnie u osoby, ktora poprosila o jej
    mniej. Ramki kart zostaja na Motion w obu przypadkach: to jedna wartosc
    na karte i to od niej zalezy, czy sekcja w ogole sie sklada.
  */
  const reveal = profile === 'desktop' && !reduceMotion

  // Piec jawnych wywolan zamiast petli: hooki musza byc bezwarunkowe, a kart
  // jest stala piatka (`CAPABILITY_KEYS`).
  const tracker = useCapabilityCardMotion(progress, 'tracker', profile)
  const calendar = useCapabilityCardMotion(progress, 'calendar', profile)
  const invoices = useCapabilityCardMotion(progress, 'invoices', profile)
  const reports = useCapabilityCardMotion(progress, 'reports', profile)
  const integrations = useCapabilityCardMotion(progress, 'integrations', profile)

  const shared = { progress, profile, reveal }

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32"
    >
      <span className="lp-eyebrow">{t('eyebrow')}</span>
      <h2 id="capabilities-heading" className="lp-display lp-d2 mt-3 max-w-[16ch]">
        {t('heading')}
      </h2>

      {/* Tor timeline'u = dokladnie ta siatka. Zmiana liczby wierszy zmienia
          znaczenie okien w `motion/capability.ts` — sa tam opisane. */}
      <div ref={gridRef} className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <TrackerCard {...shared} enter={tracker} />
        <CalendarCard {...shared} enter={calendar} month={month} />
        <InvoicesCard {...shared} enter={invoices} />
        <ReportsCard {...shared} enter={reports} />
        <IntegrationsCard {...shared} enter={integrations} />
      </div>
    </section>
  )
}
