'use client'

import { useTranslations } from 'next-intl'
import { HEATMAP_LEVELS } from '@/components/ui/tokens'
import { useFormat } from '@/lib/format/client'
import type { HeatmapDay } from '../../domain'
import { ReportCard } from '../shared/ReportCard'

type Props = {
  days: HeatmapDay[]
}

/**
 * Intensywnosc pracy dzien po dniu.
 *
 * Bez biblioteki — to siatka `<div>`-ow na tych samych pieciu stopniach
 * (`HEATMAP_LEVELS`), ktorych uzywa karta godzin na Pulpicie, wiec kolor
 * heatmapy idzie za motywem zamiast byc drugim, wlasnym zielonym.
 *
 * Domena decyduje, CZY sekcja ma sens (`buildHeatmap` zwraca `null` dla
 * krotkich zakresow) — komponent tylko rysuje to, co dostal.
 */
export function ReportsHeatmapSection({ days }: Props) {
  const t = useTranslations('reports')
  const fmt = useFormat()

  return (
    <ReportCard
      title={t('heatmap.title')}
      ariaLabel={t('heatmap.sectionLabel')}
      action={
        <span aria-hidden className="flex items-center gap-1.5 text-2xs text-zinc-400">
          {t('heatmap.legendLess')}
          {HEATMAP_LEVELS.map((background, level) => (
            <span
              key={level}
              className="size-2.5 rounded-[3px]"
              style={{ background }}
            />
          ))}
          {t('heatmap.legendMore')}
        </span>
      }
    >
      <ul
        role="list"
        className="mt-4 grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto pb-1"
      >
        {days.map((day) => {
          // `aria-label` zamiast dodatkowego `<span class="sr-only">`: rok pracy
          // to ~365 komorek, wiec kazdy zbedny wezel mnozy sie przez 365.
          const label =
            day.hours > 0
              ? t('heatmap.dayLabel', {
                  date: fmt.date(day.date, 'short'),
                  hours: fmt.hours(day.hours),
                })
              : t('heatmap.noWork', { date: fmt.date(day.date, 'short') })

          return (
            <li
              key={day.date}
              title={label}
              aria-label={label}
              className="size-[11px] rounded-[3px] sm:size-3"
              style={{ background: HEATMAP_LEVELS[day.level] }}
            />
          )
        })}
      </ul>
    </ReportCard>
  )
}
