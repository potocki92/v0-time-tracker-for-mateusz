'use client'

import { useTranslations } from 'next-intl'

import { toMinor } from '@/lib/format'
import { useFormat } from '@/lib/format/client'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_INVOICE,
  DEMO_MONTH,
  DEMO_RATE_EUR,
  demoClient,
  demoProject,
  type DemoMonth,
} from '../../demo/demo-data'
import { useDemoNames } from '../../demo/useDemoNames'
import { Card, Eyebrow, Pill } from '../ui'

/**
 * Faktura — replika buildera z `features/invoices`: numer w formacie
 * aplikacji, okres rozliczeniowy, pozycje z ilosc × cena, podsumowanie
 * netto / VAT / brutto i status cyklu zycia.
 *
 * Pozycja bierze godziny wprost z miesiaca policzonego przez automat, wiec
 * kwota na fakturze jest tą samą liczba, ktora widac w kalendarzu. Numer
 * faktury i nazwy klienta/projektu to DANE — nie tlumaczymy ich.
 */
export function InvoiceScreen({ month }: { month: DemoMonth }) {
  const t = useTranslations('marketing.app.invoice')
  const fmt = useFormat()
  const names = useDemoNames()
  const client = demoClient(DEMO_INVOICE.clientId)
  const project = demoProject(DEMO_AUTOMATION_TARGET.projectId)
  const period = fmt.monthTitle(DEMO_MONTH.iso)
  const net = month.earningsEur
  const vat = net * DEMO_INVOICE.vatRate
  const gross = net + vat

  return (
    <div className="flex h-full flex-col gap-2">
      <Card className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-2 border-b border-[var(--lp-hair)] pb-2">
          <div>
            <p className="lp-mono lp-t12 font-semibold text-white">{DEMO_INVOICE.number}</p>
            <p className="lp-t9 text-zinc-400">{t('period', { period })}</p>
          </div>
          <div className="text-right">
            <Pill>{t(`status.${DEMO_INVOICE.status}`)}</Pill>
            <p className="mt-1 lp-t8 text-zinc-400">
              {t('issuedAndDue', {
                issued: fmt.date(DEMO_INVOICE.issueDate, 'dayMonth'),
                due: fmt.date(DEMO_INVOICE.dueDate, 'dayMonth'),
              })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 border-b border-[var(--lp-hair)] py-2">
          <div>
            <Eyebrow>{t('seller')}</Eyebrow>
            <p className="mt-1 lp-t9 text-zinc-300">{names.seller.name}</p>
          </div>
          <div>
            <Eyebrow>{t('buyer')}</Eyebrow>
            <p className="mt-1 lp-t9 text-zinc-300">{names.client(client.id)}</p>
          </div>
        </div>

        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left lp-t8 uppercase tracking-wide text-zinc-400">
              <th className="pb-1 font-medium">{t('table.description')}</th>
              <th className="pb-1 text-right font-medium">{t('table.quantity')}</th>
              <th className="pb-1 text-right font-medium">{t('table.price')}</th>
              <th className="pb-1 text-right font-medium">{t('table.value')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="lp-t9 text-zinc-200">
              <td className="py-1.5">
                {names.project(project.id)}
                <span className="block lp-t8 text-zinc-400">{t('lineNote', { period })}</span>
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums">
                {fmt.hours(month.totalHours)}
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums">
                {fmt.money(toMinor(DEMO_RATE_EUR), 'EUR')}
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums text-white">
                {fmt.money(toMinor(net), 'EUR')}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-auto space-y-1 border-t border-[var(--lp-hair)] pt-2 lp-t9">
          <Row label={t('net')} value={fmt.money(toMinor(net), 'EUR')} />
          <Row
            label={t('vat', { rate: fmt.percent(DEMO_INVOICE.vatRate), note: t('vatNote') })}
            value={fmt.money(toMinor(vat), 'EUR')}
          />
          <div className="flex items-center justify-between border-t border-[var(--lp-hair)] pt-1.5">
            <span className="lp-t10 font-medium text-white">{t('total')}</span>
            <span className="lp-mono lp-t13 font-semibold tabular-nums text-[var(--lp-accent)]">
              {fmt.money(toMinor(gross), 'EUR')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-zinc-400">
      <span>{label}</span>
      <span className="lp-mono tabular-nums">{value}</span>
    </div>
  )
}
