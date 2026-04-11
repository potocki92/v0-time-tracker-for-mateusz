// DashboardContent.tsx — Client Component
'use client'

import { useMemo, useState } from 'react'
import { DashboardData, TimeRange } from '../_domain/dashboard.types'
import { selectUnpaidInvoices } from '../_domain/dashboard.selectors'
import { calculateTotals } from '@/lib/finance/totals'
import { getDateRange } from '@/lib/date/dateRange'
import { useFilteredEntries } from '../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../_hooks/useEarningsTrend'
import { DashboardHeader } from './DashboardHeader'
import { EarningsCard } from './EarningsCard'
import { GoalCard } from './GoalCard'
import { StatsCards } from './StatsCards'
import { InvoicesList } from './InvoicesList'
import { EarningsChart } from './EarningsChart'

type Props = {
  data: DashboardData
}

export function DashboardContent({ data }: Props) {
  const [range, setRange] = useState<TimeRange>('current_week')

  const { workEntries, clients, invoices, eurToPlnRate, userName } = data

  const parsedDateRange = useMemo(() => getDateRange(range), [range])
  const filteredEntries = useFilteredEntries(workEntries, parsedDateRange)

  const totals = useMemo(
    () => calculateTotals(filteredEntries, clients, eurToPlnRate),
    [filteredEntries, clients, eurToPlnRate]
  )

  const trend = useEarningsTrend(workEntries, clients, eurToPlnRate, range)

  const unpaidInvoices = useMemo(
    () => selectUnpaidInvoices(data),
    [data]
  )

  const clientsCount = useMemo(
    () => new Set(filteredEntries.map(e => e.client_id).filter(Boolean)).size,
    [filteredEntries]
  )

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
            workEntries={filteredEntries}
            clients={clients}
            eurToPlnRate={eurToPlnRate}
            dateRange={parsedDateRange}
          />
        </div>
        <div>
          <InvoicesList invoices={unpaidInvoices} />
        </div>
      </div>
    </div>
  )
}
