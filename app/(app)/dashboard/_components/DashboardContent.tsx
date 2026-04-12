// _components/DashboardContent.tsx
'use client'

import { useMemo, useState } from 'react'
import { useDashboardData } from '../_hooks/useDashboardData'
import { TimeRange } from '../_domain/dashboard.types'
import { DashboardHeader } from './DashboardHeader'
import { EarningsCard } from './EarningsCard'
import { GoalCard } from './GoalCard'
import { StatsCards } from './StatsCards'
import { InvoicesList } from './InvoicesList'
import { EarningsChart } from './EarningsChart'
import { calculateTotals } from '@/lib/finance/totals'
import { useFilteredEntries } from '../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../_hooks/useEarningsTrend'
import { getDateRange } from '@/lib/date/dateRange'

export function DashboardContent() {
  const { data } = useDashboardData()
  const [range, setRange] = useState<TimeRange>('current_week')

  const eurRate = data.eurToPlnRate
  const userName = data.userName

  const dateRange = useMemo(() => getDateRange(range), [range])

  const filteredEntries = useFilteredEntries(data.workEntries, dateRange)

  const totals = useMemo(
    () => calculateTotals(filteredEntries, data.clients, eurRate),
    [filteredEntries, data.clients, eurRate]
  )

  const clientsCount = useMemo(
    () => new Set(filteredEntries.map((e) => e.client_id).filter(Boolean)).size,
    [filteredEntries]
  )

  const unpaidInvoices = useMemo(
    () => data.invoices.filter((inv) => !inv.is_paid),
    [data.invoices]
  )

  const trend = useEarningsTrend(data.workEntries, data.clients, eurRate, range)

  return (
    <div className="container space-y-6 px-4 py-6">
      <DashboardHeader
        range={range}
        onChangeRange={(val) => setRange(val as TimeRange)}
        userName={userName}
        periodLabel="Podsumowanie finansowe"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <EarningsCard
          totalPLN={totals.totalEarningsAllPLN}
          totalEUR={totals.earningsEUR}
          trend={trend}
        />
        <GoalCard
          progress={totals.totalEarningsAllPLN > 0
            ? (totals.totalEarningsAllPLN / 15000) * 100
            : 0}
          target={15000}
          currency="PLN"
        />
      </div>

      <StatsCards
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        clientsCount={clientsCount}
        absences={totals.vacationDays + totals.sickDays}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsChart
            workEntries={data.workEntries}
            clients={data.clients}
            eurToPlnRate={eurRate}
          />
        </div>
        <div>
          <InvoicesList invoices={unpaidInvoices} />
        </div>
      </div>
    </div>
  )
}
