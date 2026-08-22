import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/format'
import { calculateInvoiceAnalytics } from '@/lib/finance/invoice-analytics'
import type { Client, Invoice } from '@/lib/types'
import { AnalyticsCards } from './_components/AnalyticsCards'
import { RevenueChart } from './_components/RevenueChart'
import { StatusDistribution } from './_components/StatusDistribution'
import { TopClientsTable } from './_components/TopClientsTable'

/**
 * Analityka czyta tylko to, czego uzywa `calculateInvoiceAnalytics`
 * (kwoty, waluta, daty) i `deriveInvoiceStatus` (status, due_date,
 * is_paid, invoice_number). Reszta wiersza — blok szablonu PDF, notatki,
 * file_url — nie jest tu potrzebna.
 */
const INVOICES_ANALYTICS_COLUMNS =
  'id, client_id, invoice_number, issue_date, invoice_date, due_date, paid_date, amount, gross_amount, currency, is_paid, status, created_at'

/** Jawny sufit zamiast odczytu rosnacego liniowo z historia. */
const INVOICES_ANALYTICS_MAX = 2_000

export const dynamic = 'force-dynamic'

export default async function InvoicesAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <p className="p-6">Musisz być zalogowany.</p>
  }

  const [{ data: invoices }, { data: clients }, { data: profile }] = await Promise.all([
    supabase
      .from('invoices')
      .select(INVOICES_ANALYTICS_COLUMNS)
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(INVOICES_ANALYTICS_MAX),
    supabase.from('clients').select('id, name').eq('user_id', user.id),
    supabase.from('profiles').select('eur_to_pln').eq('id', user.id).maybeSingle(),
  ])

  const clientNames = Object.fromEntries(((clients ?? []) as Pick<Client, 'id' | 'name'>[]).map((c) => [c.id, c.name]))
  const eurRate = Number(profile?.eur_to_pln ?? 4.3) || 4.3

  const analytics = calculateInvoiceAnalytics({
    invoices: (invoices ?? []) as Invoice[],
    clientNames,
    eurRate,
  })

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analityka faktur</h1>
        <p className="text-sm text-muted-foreground">
          Przegląd przychodów, DSO, top klientów i statusów. Kwoty przeliczone na PLN wg kursu {formatNumber(eurRate, { decimals: 2 })}.
        </p>
      </header>

      <AnalyticsCards analytics={analytics} />

      <RevenueChart data={analytics.monthlyRevenue} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TopClientsTable clients={analytics.topClients} />
        <StatusDistribution distribution={analytics.statusDistribution} />
      </div>
    </div>
  )
}
