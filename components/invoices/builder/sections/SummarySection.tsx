'use client'

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatMoney, type InvoiceTotals } from '@/lib/finance/invoice-builder-engine'
import { SectionCard } from '../parts/SectionCard'

interface SummarySectionProps {
  totals: InvoiceTotals
}

/**
 * Summary card. Shows the per-VAT-bucket breakdown plus the grand totals and,
 * when applicable, the PLN equivalent of a foreign-currency invoice. The whole
 * panel reads from `totals` only — it has no form state of its own, which is
 * what keeps it pure and trivially memoizable.
 */
export function SummarySection({ totals }: SummarySectionProps) {
  return (
    <SectionCard title="Podsumowanie" description="Wartości aktualizują się automatycznie po każdej zmianie pozycji.">
      {totals.has_special_vat ? (
        <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>Faktura zawiera pozycje z odwrotnym obciążeniem / NP</AlertTitle>
          <AlertDescription>
            Pamiętaj o adnotacji na fakturze (&quot;reverse charge&quot; / &quot;mechanizm odwrotnego obciążenia&quot;).
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Rozbicie wartości faktury na stawki VAT</caption>
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-4 text-left font-medium">Stawka</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Netto</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">VAT</th>
              <th scope="col" className="py-2 text-right font-medium">Brutto</th>
            </tr>
          </thead>
          <tbody>
            {totals.vat_breakdown.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  Dodaj przynajmniej jedną pozycję, aby zobaczyć podsumowanie.
                </td>
              </tr>
            ) : (
              totals.vat_breakdown.map((row) => (
                <tr key={`${row.mode}-${row.rate}`} className="border-b last:border-b-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">{row.label}</th>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatMoney(row.net)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatMoney(row.vat)}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatMoney(row.gross)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 text-base">
              <th scope="row" className="py-3 pr-4 text-left">Razem</th>
              <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(totals.net)}</td>
              <td className="py-3 pr-4 text-right tabular-nums">{formatMoney(totals.vat)}</td>
              <td className="py-3 text-right tabular-nums font-bold">{formatMoney(totals.gross)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {totals.gross_in_pln ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Wartość brutto w PLN (po przeliczeniu)</span>
          <span className="font-semibold tabular-nums">{formatMoney(totals.gross_in_pln)}</span>
        </div>
      ) : null}
    </SectionCard>
  )
}
