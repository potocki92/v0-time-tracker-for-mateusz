'use client'

import { useTranslations } from 'next-intl'

import { useFormat } from '@/lib/format/client'

import { DEMO_PRESENCE } from '../../demo/demo-data'

/**
 * Etap 2 automatu: „a w tych dniach bylem w domu".
 *
 * Os obecnosci jest PROPORCJONALNA — kazdy odcinek rosnie liczba swoich dni
 * (`flexGrow`), wiec pasek jest w skali miesiaca, a nie trzema rownymi
 * kaflami. Dzieki temu widac to, co decyduje o wyniku: dwa wyjazdy zajmuja
 * wiekszosc wrzesnia, a pobyt w domu wycina z niego osiem dni w srodku.
 *
 * To pierwsze miejsce na stronie, w ktorym pojawia sie emerald — i pojawia
 * sie jako STATUS („tu automat pisze"), a nie jako dekoracja. Ten sam kolor
 * wraca zaraz potem na wypelnionych dniach kalendarza i na sumie miesiaca.
 *
 * `flexGrow` w `style` jest statyczne i NIE jedzie na scrollu: proporcje
 * odcinkow nie zmieniaja sie ani razu, wiec uklad liczy sie jeden raz.
 */
export function PresenceBand() {
  const t = useTranslations('marketing.automation')
  const fmt = useFormat()

  return (
    <div>
      <p className="lp-eyebrow">{t('presenceTitle')}</p>

      <ul className="mt-4 flex items-start gap-2 sm:mt-5 sm:gap-3">
        {DEMO_PRESENCE.map((entry) => (
          <li key={entry.from} className="min-w-0" style={{ flexGrow: entry.days }}>
            <span
              aria-hidden
              className={`block h-1 rounded-full ${
                entry.kind === 'trip' ? 'bg-[var(--lp-accent)]' : 'bg-white/12'
              }`}
            />
            <span
              className={`mt-2.5 block truncate lp-t10 uppercase tracking-[0.12em] ${
                entry.kind === 'trip' ? 'text-[var(--lp-ink-1)]' : 'text-[var(--lp-ink-3)]'
              }`}
            >
              {t(`presence.${entry.kind}`)}
            </span>
            <span className="lp-mono mt-0.5 block truncate lp-t10 tabular-nums text-[var(--lp-ink-3)]">
              {fmt.dateRange(entry.from, entry.to)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
