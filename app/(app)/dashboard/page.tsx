'use client'

import { useState, useMemo } from 'react'
import { useDashboardData } from './_hooks/useDashboardData'
import { useFilteredEntries } from './_hooks/useFilteredEntries'

import { DashboardHeader } from './_components/DashboardHeader'
import { EarningsCard } from './_components/EarningsCard'
import { StatsCards } from './_components/StatsCards'
import { EarningsChart } from './_components/EarningsChart'
import { DashboardSkeleton } from './_components/DashboardSkeleton'
import { GoalCard } from './_components/GoalCard'
import { InvoicesList } from './_components/InvoicesList'

export default function DashboardPage() {
  const { loading, data } = useDashboardData()
  const [range, setRange] = useState('current_month')

  // Filtrujemy wpisy na podstawie wybranego zakresu
  const filteredEntries = useFilteredEntries(data?.workEntries ?? [], range)

  // Obliczamy statystyki potrzebne dla komponentów
  const stats = useMemo(() => {
    if (!filteredEntries.length) return null

    const totalPLN = filteredEntries.reduce((sum, entry) => sum + (entry.amountPLN || 0), 0)
    const totalEUR = filteredEntries.reduce((sum, entry) => sum + (entry.amountEUR || 0), 0)
    const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
    
    // Unikalni klienci w przefiltrowanych wpisach
    const uniqueClients = new Set(filteredEntries.map(e => e.clientId)).size

    return {
      totalPLN,
      totalEUR,
      totalHours,
      clientsCount: uniqueClients,
      // Tutaj możesz dodać logikę obliczania dni i nieobecności zależnie od Twoich danych
      totalDays: Math.ceil(totalHours / 8), 
      absences: 0 
    }
  }, [filteredEntries])

  if (loading || !data) return <DashboardSkeleton />

  return (
    <div className="container space-y-6 px-4 py-6">
      <DashboardHeader 
        range={range} 
        onChangeRange={setRange} 
        userName={data.user?.name}
        periodLabel="Podsumowanie Twojej aktywności"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <EarningsCard 
          totalPLN={stats?.totalPLN ?? 0} 
          totalEUR={stats?.totalEUR ?? 0}
          trend={2.5} // Przykładowy trend, docelowo obliczany z porównania okresów
        />
        
        {/* Przykład użycia GoalCard, jeśli masz zdefiniowany cel w danych */}
        <GoalCard 
          progress={((stats?.totalPLN ?? 0) / 15000) * 100} 
          target={15000} 
          currency="PLN" 
        />
      </div>

      <StatsCards 
        totalHours={stats?.totalHours ?? 0}
        totalDays={stats?.totalDays ?? 0}
        clientsCount={stats?.clientsCount ?? 0}
        absences={stats?.absences ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Mapowanie danych pod wykres EarningsChart */}
          <EarningsChart data={data.chartData ?? []} />
        </div>
        
        <div>
          <InvoicesList invoices={data.pendingInvoices ?? []} />
        </div>
      </div>
    </div>
  )
}
