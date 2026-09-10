'use client'

import type { ReactNode } from 'react'
import { m, type MotionValue } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import { DEMO_INVOICES, type DemoInvoiceRow } from '../../../demo/demo-data'
import {
  capabilityStep,
  capabilityWindow,
  useCapabilityStepMotion,
  type ProgressWindow,
} from '../../../motion/capability'
import { Pill } from '../../../product/ui'
import { CapabilityCard, type CapabilityCardProps } from '../CapabilityCard'

/**
 * Karta 03 — faktury. Trzy ostatnie dokumenty, jeden po drugim.
 *
 * Wiersz to numer, status i kwota — czyli DANE, nie dekoracja, wiec lista
 * zostaje zwyklym `<ul>` widocznym dla czytnika ekranu. Ruch dotyka
 * wylacznie `opacity` i `transform` wiersza; status i kwota nie dostaja
 * wlasnych krzywych, bo trzy wartosci na wiersz zamiast jednej to trzykrotny
 * rachunek za efekt, ktorego przy 6-pikselowym przesunieciu nikt nie
 * rozdzieli okiem.
 */
export function InvoicesCard({ progress, profile, enter, reveal }: CapabilityCardProps) {
  const window = capabilityWindow('invoices', profile)

  return (
    <CapabilityCard
      cardKey="invoices"
      enter={enter}
      icon={<FileText size={14} />}
      className="lg:col-span-4"
    >
      <ul className="divide-y divide-[var(--lp-hair)] border-t border-[var(--lp-hair)]">
        {reveal ? (
          <RowsRevealed progress={progress} window={window} />
        ) : (
          DEMO_INVOICES.map((invoice) => (
            <li key={invoice.number}>
              <InvoiceRow invoice={invoice} />
            </li>
          ))
        )}
      </ul>
    </CapabilityCard>
  )
}

function InvoiceRow({ invoice }: { invoice: DemoInvoiceRow }) {
  const t = useTranslations('marketing.app.invoice.status')
  const fmt = useFormat()

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        {/* Numer faktury to DANE — nie tlumaczy sie go w zadnym jezyku. */}
        <p className="lp-mono truncate lp-t11 text-white">{invoice.number}</p>
        <p className="mt-1">
          <Pill tone={invoice.status === 'paid' ? 'accent' : 'mute'}>{t(invoice.status)}</Pill>
        </p>
      </div>
      <span className="lp-mono shrink-0 lp-t12 tabular-nums text-[var(--lp-ink-2)]">
        {fmt.money(toMinor(invoice.amountEur), 'EUR')}
      </span>
    </div>
  )
}

function RevealedRow({
  progress,
  window,
  children,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
  children: ReactNode
}) {
  const step = useCapabilityStepMotion(progress, window, 6)

  return (
    <m.li className="lp-motion" style={{ opacity: step.opacity, transform: step.transform }}>
      {children}
    </m.li>
  )
}

/**
 * Trzy jawne wywolania zamiast petli — hooki musza byc bezwarunkowe.
 * Dopisanie czwartej faktury do `DEMO_INVOICES` wymaga wiec dopisania
 * czwartego wiersza tutaj; test `__test__/landing/capabilities.test.ts`
 * pilnuje, ze obie liczby sie zgadzaja.
 */
function RowsRevealed({
  progress,
  window,
}: {
  progress: MotionValue<number>
  window: ProgressWindow
}) {
  const count = DEMO_INVOICES.length
  const row0 = capabilityStep(window, 0, count)
  const row1 = capabilityStep(window, 1, count)
  const row2 = capabilityStep(window, 2, count)

  return (
    <>
      <RevealedRow progress={progress} window={row0}>
        <InvoiceRow invoice={DEMO_INVOICES[0]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={row1}>
        <InvoiceRow invoice={DEMO_INVOICES[1]} />
      </RevealedRow>
      <RevealedRow progress={progress} window={row2}>
        <InvoiceRow invoice={DEMO_INVOICES[2]} />
      </RevealedRow>
    </>
  )
}
