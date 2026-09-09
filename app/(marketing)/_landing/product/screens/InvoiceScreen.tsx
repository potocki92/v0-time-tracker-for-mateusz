import { formatHours, formatMoney, formatPercent, toMinor } from '@/lib/format'

import {
  DEMO_AUTOMATION_TARGET,
  DEMO_INVOICE,
  DEMO_RATE_EUR,
  demoClient,
  demoProject,
  type DemoMonth,
} from '../../demo/demo-data'
import { Card, Eyebrow, Pill } from '../ui'

/**
 * Faktura — replika buildera z `features/invoices`: numer w formacie
 * aplikacji, okres rozliczeniowy, pozycje z ilosc × cena, podsumowanie
 * netto / VAT / brutto i status cyklu zycia.
 *
 * Pozycja bierze godziny wprost z miesiaca policzonego przez automat, wiec
 * kwota na fakturze jest tą samą liczba, ktora widac w kalendarzu.
 */
export function InvoiceScreen({ month }: { month: DemoMonth }) {
  const client = demoClient(DEMO_INVOICE.clientId)
  const project = demoProject(DEMO_AUTOMATION_TARGET.projectId)
  const net = month.earningsEur
  const vat = net * DEMO_INVOICE.vatRate
  const gross = net + vat

  return (
    <div className="flex h-full flex-col gap-2">
      <Card className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-2 border-b border-[var(--lp-hair)] pb-2">
          <div>
            <p className="lp-mono lp-t12 font-semibold text-white">{DEMO_INVOICE.number}</p>
            <p className="lp-t9 text-zinc-400">Okres: {DEMO_INVOICE.period}</p>
          </div>
          <div className="text-right">
            <Pill>{DEMO_INVOICE.status}</Pill>
            <p className="mt-1 lp-t8 text-zinc-400">
              Wystawiona {DEMO_INVOICE.issueDate} · termin {DEMO_INVOICE.dueDate}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 border-b border-[var(--lp-hair)] py-2">
          <div>
            <Eyebrow>Sprzedawca</Eyebrow>
            <p className="mt-1 lp-t9 text-zinc-300">Mateusz Potocki</p>
          </div>
          <div>
            <Eyebrow>Nabywca</Eyebrow>
            <p className="mt-1 lp-t9 text-zinc-300">{client.name}</p>
          </div>
        </div>

        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left lp-t8 uppercase tracking-wide text-zinc-400">
              <th className="pb-1 font-medium">Opis</th>
              <th className="pb-1 text-right font-medium">Ilość</th>
              <th className="pb-1 text-right font-medium">Cena</th>
              <th className="pb-1 text-right font-medium">Wartość</th>
            </tr>
          </thead>
          <tbody>
            <tr className="lp-t9 text-zinc-200">
              <td className="py-1.5">
                {project.name}
                <span className="block lp-t8 text-zinc-400">
                  Prace wg ewidencji czasu · {DEMO_INVOICE.period}
                </span>
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums">
                {formatHours(month.totalHours)}
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums">
                {formatMoney(toMinor(DEMO_RATE_EUR), 'EUR')}
              </td>
              <td className="lp-mono py-1.5 text-right tabular-nums text-white">
                {formatMoney(toMinor(net), 'EUR')}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-auto space-y-1 border-t border-[var(--lp-hair)] pt-2 lp-t9">
          <Row label="Netto" value={formatMoney(toMinor(net), 'EUR')} />
          <Row
            label={`VAT ${formatPercent(DEMO_INVOICE.vatRate)} · ${DEMO_INVOICE.vatNote}`}
            value={formatMoney(toMinor(vat), 'EUR')}
          />
          <div className="flex items-center justify-between border-t border-[var(--lp-hair)] pt-1.5">
            <span className="lp-t10 font-medium text-white">Razem do zapłaty</span>
            <span className="lp-mono lp-t13 font-semibold tabular-nums text-[var(--lp-accent)]">
              {formatMoney(toMinor(gross), 'EUR')}
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
