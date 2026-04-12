'use client'

import { useState, useMemo } from 'react'
import { useDashboardData, useFilteredEntries, useEarningsTrend, useDashboardTotals, usePeriodLabel, useUnpaidInvoices }  from '../_hooks'
import { getDateRange, getPrevRange } from '@/lib/date/dateRange'
import type { TimeRange } from '../_domain/'
import { DashboardHeader } from './DashboardHeader'
import { EarningsCard, GoalCard, StatsCards } from './card'
import { InvoicesList } from './invoices/InvoicesList'
import { EarningsChart } from './chart'


export function DashboardContent() {
  const { data } = useDashboardData()
  const [range, setRange] = useState<TimeRange>('current_week')

  const { eurToPlnRate: eurRate, userName, workEntries, clients, invoices } = data

  const dateRange = useMemo(() => getDateRange(range), [range])
  const prevRange = useMemo(() => getPrevRange(dateRange), [dateRange])  // ← z @/lib

  const filtered       = useFilteredEntries(workEntries, dateRange)
  const prevFiltered   = useFilteredEntries(workEntries, prevRange)
  const totals         = useDashboardTotals(filtered, clients, eurRate)
  const trend          = useEarningsTrend(filtered, prevFiltered, clients, eurRate)
  const unpaidInvoices = useUnpaidInvoices(invoices)
  const periodLabel    = usePeriodLabel(range)

  const clientsCount = useMemo(
    () => new Set(filtered.map((e) => e.client_id).filter(Boolean)).size,
    [filtered]
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
        <EarningsCard totalPLN={totals.totalEarningsAllPLN} totalEUR={totals.earningsEUR} trend={trend} />
        <GoalCard progress={(totals.totalEarningsAllPLN / 15000) * 100} target={15000} currency="PLN" />
      </div>
      <StatsCards
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        clientsCount={clientsCount}
        absences={totals.vacationDays + totals.sickDays}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EarningsChart workEntries={workEntries} clients={clients} eurToPlnRate={eurRate} />
        </div>
        <InvoicesList invoices={unpaidInvoices} />
      </div>
    </div>
  )
}
