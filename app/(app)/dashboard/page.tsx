"use client"

import { useMemo, useState } from "react";
import { useDashboardData } from "./_hooks/useDashboardData"
import { TimeRange } from "./_domain/dashboard.types";
import { DashboardHeader } from "./_components/DashboardHeader";
import { EarningsCard } from "./_components/EarningsCard";
import { calculateTotals } from "@/lib/finance/totals";
import { useFilteredEntries } from "./_hooks/useFilteredEntries";
import { useEarningsTrend } from "./_hooks/useEarningsTrend";
import { GoalCard } from "./_components/GoalCard";
import { StatsCards } from "./_components/StatsCards";
import { InvoicesList } from "./_components/InvoicesList";
import { EarningsChart } from "./_components/EarningsChart";
import { getDateRange } from "@/lib/date/dateRange";

export default function DashboardPage()
{
    const { data, isLoading, isError } = useDashboardData();
    const [range, setRange] = useState<TimeRange>('current_month');
    const parsedDataRange = useMemo(() => {
        return getDateRange(range);
    },[range])
    const rawEntries = data?.workEntries ?? [];
    const rawClients = data?.clients ?? [];
    const rawInvoices = data?.invoices ?? [];

    const eurRate = data?.eurToPlnRate ?? 4.3;
    const userName = data?.userName ?? 'Użytkowniku'

    const filteredEntries = useFilteredEntries(rawEntries, range);
    const totals = useMemo(() => {
        return calculateTotals(filteredEntries, rawClients, eurRate)
    }, [filteredEntries, eurRate])

    const trend = useEarningsTrend(rawEntries, rawClients, eurRate, range);
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
                    <EarningsChart
                    workEntries={filteredEntries}
                    clients={rawClients}
                    eurToPlnRate={eurRate}
                    dateRange={parsedDataRange}
                    />
                </div>
                <div>
                    <InvoicesList invoices={rawInvoices}/>
                </div>
            </div>
        </div>
    )
}