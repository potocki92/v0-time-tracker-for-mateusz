import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format as formatMoney, fromMajor } from '@/lib/finance/money'
import type { AnalyticsResult } from '@/lib/finance/invoice-analytics'

interface KpiCardProps {
  title: string
  value: string
  footnote?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

function KpiCard({ title, value, footnote, tone = 'default' }: KpiCardProps) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'danger'
          ? 'text-red-600'
          : ''

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        {footnote ? <p className="text-xs text-muted-foreground mt-1">{footnote}</p> : null}
      </CardContent>
    </Card>
  )
}

export function AnalyticsCards({ analytics }: { analytics: AnalyticsResult }) {
  const { totals, dso } = analytics
  const fmt = (n: number) => formatMoney(fromMajor(n, 'PLN'))
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard title="Wystawione (PLN)" value={fmt(totals.issued)} footnote={`${totals.count} faktur`} />
      <KpiCard title="Opłacone" value={fmt(totals.paid)} footnote={`${totals.paid_count} faktur`} tone="success" />
      <KpiCard title="Nieopłacone" value={fmt(totals.unpaid)} tone="warning" />
      <KpiCard
        title="Zaległe"
        value={fmt(totals.overdue)}
        footnote={`${totals.overdue_count} zaległych · średni DSO: ${dso} dni`}
        tone="danger"
      />
    </div>
  )
}
