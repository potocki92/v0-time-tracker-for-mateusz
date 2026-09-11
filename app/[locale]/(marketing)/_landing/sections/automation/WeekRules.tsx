'use client'

import { useTranslations } from 'next-intl'

import { useFormat } from '@/lib/format/client'

import {
  DEMO_WEEKDAY_DATES,
  DEMO_WEEKDAY_KEYS,
  DEMO_WEEK_SCHEDULE,
} from '../../demo/demo-data'

/**
 * Etap 1 automatu: „tydzien wyglada tak".
 *
 * Caly grafik jako JEDEN wiersz typografii — bez karty, bez obrysu, bez
 * listy z kropkami. Poprzednia wersja pokazywala to samo w `lp-card` obok
 * dwoch innych kart i kalendarza: siedem malych liczb przegrywalo wtedy
 * konkurencje o uwage z wszystkim dookola. Tutaj sa jedyna rzecza na ekranie,
 * wiec moga byc duze i czytac sie z odleglosci.
 *
 * Emerald nie pojawia sie tu ani razu — akcent jest zarezerwowany dla WYNIKU
 * automatu (wypelnione dni, suma miesiaca). Dzien wolny znaczy sama jasnosc.
 */
export function WeekRules() {
  const t = useTranslations('marketing.automation')
  const fmt = useFormat()

  return (
    <div>
      <p className="lp-eyebrow">{t('scheduleTitle')}</p>

      <ul className="mt-5 grid grid-cols-7 gap-x-1 sm:mt-7 sm:gap-x-4">
        {DEMO_WEEKDAY_KEYS.map((key, index) => {
          const plan = DEMO_WEEK_SCHEDULE[key]

          return (
            <li key={key} className="min-w-0 text-center">
              <span className="block lp-t10 uppercase tracking-[0.12em] text-[var(--lp-ink-3)]">
                {fmt.weekday(DEMO_WEEKDAY_DATES[index], 'short')}
              </span>
              <span
                className={`lp-mono mt-2 block truncate text-sm tabular-nums sm:mt-3 sm:text-2xl lg:text-4xl ${
                  plan.enabled ? 'text-white' : 'text-[var(--lp-ink-3)]'
                }`}
              >
                {plan.enabled ? fmt.hours(plan.hours) : t('dayOff')}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
