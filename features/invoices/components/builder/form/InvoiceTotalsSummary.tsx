'use client'

import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  computeInvoiceTotals,
  formatMoney,
} from '@/lib/finance/invoice-builder-engine'
import type { InvoiceBuilderValues } from '@/lib/schemas/invoice-builder.schema'

/**
 * Read-only totals panel. Subscribes only to the slices that affect the
 * computation (items + currency + FX rate) so unrelated edits — buyer
 * address, notes, payment details — don't trigger a re-tally.
 *
 * All arithmetic delegates to `invoice-builder-engine`, which works in
 * minor units (bigint) and rounds half-away-from-zero. That keeps the UI
 * dumb: render whatever the engine returns, exactly as it would be saved.
 */
export function InvoiceTotalsSummary() {
  const { control } = useFormContext<InvoiceBuilderValues>()
  const items = useWatch({ control, name: 'items' })
  const currency = useWatch({ control, name: 'currency' })
  const exchangeRate = useWatch({ control, name: 'exchange_rate' })

  const totals = React.useMemo(
    () =>
      computeInvoiceTotals({
        items:         items ?? [],
        currency,
        exchange_rate: exchangeRate,
      }),
    [items, currency, exchangeRate],
  )

  return (
    <div className="space-y-3" aria-live="polite">
      {/* VAT breakdown — one row per (mode, rate) bucket. */}
      <div className="overflow-hidden rounded-xl border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">Stawka</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Netto</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">VAT</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Brutto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {totals.vat_breakdown.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Dodaj pozycje, aby zobaczyć rozbicie kwot.
                </td>
              </tr>
            ) : (
              totals.vat_breakdown.map((row) => (
                <tr key={`${row.mode}:${row.rate}`} className="text-foreground">
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    <span className={cn('inline-flex items-center gap-1.5')}>
                      {row.label}
                      {row.mode !== 'standard' ? (
                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          spec.
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatMoney(row.net)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {formatMoney(row.vat)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {formatMoney(row.gross)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom totals — netto / VAT / brutto and optional PLN equivalent. */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TotalsCell label="Razem netto" value={formatMoney(totals.net)} />
        <TotalsCell label="Razem VAT" value={formatMoney(totals.vat)} />
        <TotalsCell
          label="Razem brutto"
          value={formatMoney(totals.gross)}
          emphasis
        />
        {totals.gross_in_pln ? (
          <TotalsCell
            label={`Brutto w PLN (kurs ${exchangeRate})`}
            value={formatMoney(totals.gross_in_pln)}
          />
        ) : currency !== 'PLN' ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-1 px-3 py-2 text-xs text-muted-foreground">
            Podaj kurs wymiany, aby zobaczyć równowartość w PLN.
          </div>
        ) : null}
      </dl>

      {totals.has_special_vat ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Faktura zawiera pozycje ze specjalnym trybem VAT (zw. / np. /
          reverse charge). Pamiętaj o adnotacji na dokumencie.
        </p>
      ) : null}
    </div>
  )
}

function TotalsCell({
  label,
  value,
  emphasis,
}: {
  label:    string
  value:    string
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-hairline bg-surface-2 px-3 py-2',
        emphasis && 'border-emerald-500/40 bg-emerald-500/10',
      )}
    >
      <dt className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 font-mono tabular-nums text-sm',
          emphasis && 'text-base font-semibold text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
