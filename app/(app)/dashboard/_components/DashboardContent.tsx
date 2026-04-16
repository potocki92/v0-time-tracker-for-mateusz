// app/(app)/dashboard/_components/DashboardContent.tsx
'use client'

import { useState, useMemo }          from 'react'
import { useDashboardData }           from '../_hooks'
import { useFilteredEntries }         from '../_hooks/useFilteredEntries'
import { useEarningsTrend }           from '../_hooks/useEarningsTrend'
import { useEarningsSparkline }       from '../_hooks/useEarningsSparkline'
import { usePeriodLabel }             from '../_hooks/usePeriodLabel'
import { useUnpaidInvoices }          from '../_hooks/useUnpaidInvoices'
import { useEffectiveEurRate, useGoal } from '../_hooks/usePreferencesStore'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { TimeRange }             from '../_domain/dashboard.types'
import { DashboardHeader }            from './DashboardHeader'
import { EarningsCard }               from './card/EarningsCard'
import { GoalCard }                   from './card/GoalCard'
import { StatsCards }                 from './card/StatsCards'
import { EarningsChart }              from './chart/EarningsChart'
import {
  ChartErrorBoundary,
  InvoicesErrorBoundary,
  StatsErrorBoundary,
  EarningsCardBoundary,
  GoalCardBoundary,
} from './errors'
import { InvoicesList } from './invoices'
import { useDashboardTotals } from '../_hooks/useDashboardTotal'

export function DashboardContent() {
  const { data } = useDashboardData()
  const [range, setRange] = useState<TimeRange>('current_week')

  const { userName, workEntries, clients, invoices } = data

  const eurRate = useEffectiveEurRate()
  const goal    = useGoal()

  const dateRange      = useMemo(() => getDateRange(range),     [range])
  const prevRange      = useMemo(() => getPrevRange(dateRange), [dateRange])
  const filtered       = useFilteredEntries(workEntries, dateRange)
  const prevFiltered   = useFilteredEntries(workEntries, prevRange)
  const totals         = useDashboardTotals(filtered, clients)
  const trend          = useEarningsTrend(filtered, prevFiltered, clients)
  const sparklineData  = useEarningsSparkline(filtered, clients)
  const unpaidInvoices = useUnpaidInvoices(invoices)
  const periodLabel    = usePeriodLabel(range)
  const clientsCount   = useMemo(
    () => new Set(filtered.map((e) => e.client_id).filter(Boolean)).size,
    [filtered],
  )

  return (
    <div className="container space-y-6 px-4 py-6">
      <DashboardHeader
        range={range}
        onChangeRange={setRange}
        userName={userName}
        periodLabel={periodLabel}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <EarningsCardBoundary>
          <EarningsCard
            totalPLN={totals.totalEarningsAllPLN}
            totalEUR={totals.earningsEUR}
            trend={trend}
            sparklineData={sparklineData}
            periodLabel={periodLabel}
          />
        </EarningsCardBoundary>

        <GoalCardBoundary>
          <GoalCard
            progress={goal?.amount ? (totals.totalEarningsAllPLN / goal.amount) * 100 : 0}
            target={goal?.amount ?? 0}
            currency={goal?.currency ?? 'PLN'}
          />
        </GoalCardBoundary>
      </div>

      <StatsErrorBoundary>
        <StatsCards
          totalHours={totals.totalHours}
          totalDays={totals.totalDays}
          clientsCount={clientsCount}
          absences={totals.vacationDays + totals.sickDays}
        />
      </StatsErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartErrorBoundary>
            <EarningsChart
              workEntries={workEntries}
              clients={clients}
              eurToPlnRate={eurRate}
            />
          </ChartErrorBoundary>
        </div>

        <InvoicesErrorBoundary>
          <InvoicesList invoices={unpaidInvoices} />
        </InvoicesErrorBoundary>
      </div>
    </div>
  )
}
