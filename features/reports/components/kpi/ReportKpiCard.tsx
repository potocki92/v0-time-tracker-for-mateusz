'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SectionEyebrow } from '@/components/common/section/SectionEyebrow'
import { SURFACE } from '@/components/ui/tokens'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string
  hint?: string
  trend?: ReactNode
  icon: LucideIcon
}

/**
 * Kafelek KPI raportu.
 *
 * Rozni sie od wspolnego `StatTile` jedna rzecza, ktorej tamten nie ma i nie
 * powinien miec: slotem na znacznik zmiany. Reszta (eyebrow, tabular numbers,
 * stopnie typografii) idzie z tych samych tokenow, wiec kafelki stoja w rzedzie
 * z kafelkami pozostalych sekcji.
 */
export function ReportKpiCard({ label, value, hint, trend, icon: Icon }: Props) {
  return (
    <div className={cn(SURFACE.card, 'p-4 sm:p-5')}>
      <div className="flex items-center justify-between gap-2">
        <SectionEyebrow className="min-h-[2.4em] leading-[1.2]">{label}</SectionEyebrow>
        <Icon aria-hidden className="size-4 shrink-0 text-zinc-400" />
      </div>
      <p className="mt-2 truncate text-2xl font-semibold leading-none tabular-nums text-white sm:text-3xl">
        {value}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-2xs text-zinc-400">
        <span className="min-w-0 truncate">{hint ?? ' '}</span>
        {trend}
      </div>
    </div>
  )
}
