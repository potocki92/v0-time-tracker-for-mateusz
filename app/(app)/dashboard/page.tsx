'use client'

import { useState, useMemo } from 'react'

// Logika i Helperzy

// Hooki (Zgodnie z Twoim drzewem plików: _hooks)
import { useDashboardData } from './_hooks/useDashboardData'
import { useFilteredEntries } from './_hooks/useFilteredEntries'
import { useEarningsTrend } from './_hooks/useEarningsTrend'
import { useChartData } from './_hooks/useChartData'

// Komponenty (Zgodnie z Twoim drzewem plików: _components)
import { DashboardHeader } from './_components/DashboardHeader'
import { EarningsCard } from './_components/EarningsCard'
import { StatsCards } from './_components/StatsCards'
import { EarningsChart } from './_components/EarningsChart'
import { DashboardSkeleton } from './_components/DashboardSkeleton'
import { GoalCard } from './_components/GoalCard'
import { InvoicesList } from './_components/InvoicesList'

// Typy
import { TimeRange } from './_domain/dashboard.types'
import { calculateTotals } from '@/lib/finance/totals'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardData()
  const [range, setRange] = useState<TimeRange>('current_month')

  // --- PRZYGOTOWANIE BEZPIECZNYCH DANYCH ---
  // To zapobiega błędom "Object.entries" i ".map is not a function"
  const rawEntries = data?.workEntries ?? []
  const rawClients = data?.clients ?? []
  const rawInvoices = data?.invoices ?? []
  const eurRate = data?.eurToPlnRate ?? 4.3
  const userName = data?.userName ?? 'Użytkowniku'

  // --- LOGIKA BIZNESOWA (Zabezpieczona) ---
  const filteredEntries = useFilteredEntries(rawEntries, range)
  
  const totals = useMemo(() => {
    // Nie puszczamy nulli do calculateTotals
    return calculateTotals(filteredEntries, rawClients, eurRate)
  }, [filteredEntries, rawClients, eurRate])

  const trend = useEarningsTrend(rawEntries, rawClients, eurRate, range)
  
  const chartData = useChartData(filteredEntries, rawClients, 'daily', eurRate)

  // --- WARUNKI RENDEROWANIA ---
  if (isLoading) {
    return (
      <div className="container px-4 py-6">
        <DashboardSkeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="container flex h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Coś poszło nie tak...</h2>
          <p className="text-muted-foreground">Nie udało się pobrać danych z Supabase.</p>
        </div>
      </div>
    )
  }

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
          // W totals.ts totalEarningsAllPLN zawiera już przeliczone EUR
          totalPLN={totals.totalEarningsAllPLN} 
          totalEUR={totals.earningsEUR} 
          trend={trend} 
        />
        
        <GoalCard 
          // Przykładowy cel 15k, możesz go wyciągnąć z metadanych usera
          progress={totals.totalEarningsAllPLN > 0 ? (totals.totalEarningsAllPLN / 15000) * 100 : 0} 
          target={15000} 
          currency="PLN" 
        />
      </div>

      <StatsCards 
        totalHours={totals.totalHours}
        totalDays={totals.totalDays}
        clientsCount={new Set(filteredEntries.map(e => e.client_id).filter(Boolean)).size}
        absences={totals.vacationDays + totals.sickDays}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Chart dostaje sformatowaną tablicę z useChartData */}
          <EarningsChart data={chartData} /> 
        </div>
        
        <div>
          {/* Lista faktur z fallbackiem na pustą tablicę */}
          <InvoicesList invoices={rawInvoices} />
        </div>
      </div>
    </div>
  )
}
