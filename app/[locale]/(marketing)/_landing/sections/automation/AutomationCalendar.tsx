'use client'

import { m, type MotionValue } from 'framer-motion'
import { useTranslations } from 'next-intl'

import { useFormat } from '@/lib/format/client'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_MONTH,
  demoClient,
  type DemoMonth,
} from '../../demo/demo-data'
import { AUTOMATION } from '../../motion/automation-timeline'
import { MonthGrid } from '../../product/MonthGrid'

/**
 * Etap 3 automatu: kalendarz przejmuje ekran i sam sie wypelnia.
 *
 * Siatka lezy na czerni, bez karty i bez obrysu — jest tu jedyna powierzchnia,
 * wiec nie potrzebuje ramki, zeby oddzielic sie od czegokolwiek. Jej wysokosc
 * jest stala (`svh`) i NIE jedzie na scrollu: wypelnianie zmienia wylacznie
 * `opacity` i `transform` wpisow, nigdy geometrie siatki.
 *
 * Wynik na dole to jedyna liczba w tej sekcji, ktora ma prawo byc duza i
 * emeraldowa: to ona jest pointa calej historii. Nie jest wpisana z reki —
 * `month` policzyl `planDays`, ta sama funkcja, ktora prowadzi automat w
 * aplikacji.
 */
export function AutomationCalendar({
  month,
  progress,
  outcomeOpacity,
}: {
  month: DemoMonth
  progress: MotionValue<number>
  /** Wynik wchodzi dopiero, gdy siatka jest wypelniona — krzywa liczy sekcja. */
  outcomeOpacity: MotionValue<number>
}) {
  const t = useTranslations('marketing.automation')
  const fmt = useFormat()
  const client = demoClient(DEMO_AUTOMATION_TARGET.clientId)

  // Powody pominiecia przychodza z domeny automatu jako klucze — tlumaczy je
  // warstwa UI. Zbior, bo ten sam powod dotyczy wielu dni.
  const reasons = [
    ...new Set(
      month.days.map((day) => day.skipReason).filter((reason): reason is string => reason !== null),
    ),
  ]

  return (
    <div className="w-full max-w-[1120px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="lp-eyebrow">{fmt.monthTitle(DEMO_MONTH.iso)}</p>
        {/* Legenda pominiec bez kropek i bez obrysu: jedna linia drobnego
            tekstu zamiast listy kapsulek pod karta. */}
        <p className="lp-t11 text-[var(--lp-ink-3)]">
          {reasons.map((reason) => t(`skipReasons.${reason}`)).join(' · ')}
        </p>
      </div>

      <div className="mt-4 h-[36svh] sm:mt-5 sm:h-[40svh] lg:h-[44svh]">
        <MonthGrid
          days={month.days}
          progress={progress}
          fillRange={AUTOMATION.fill}
          clientColor={client.color}
          showAmounts={false}
          fill
        />
      </div>

      <m.p
        className="lp-motion lp-display lp-d3 lp-mono mt-5 tabular-nums text-[var(--lp-accent)] sm:mt-7"
        style={{ opacity: outcomeOpacity }}
      >
        {t('outcome', { hours: fmt.hours(month.totalHours), days: month.workedDays })}
      </m.p>
    </div>
  )
}
