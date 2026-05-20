'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDashboardData } from '../../../hooks'
import { useFilteredEntries } from '../../../hooks/useFilteredEntries'
import { useEarningsTrend } from '../../../hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../../hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../../hooks/usePeriodLabel'
import { useDashboardTotals } from '../../../hooks/useDashboardTotal'
import {
  selectEurRate,
  useEffectiveEurRate,
  usePreferencesStore,
  useGoal,
} from '../../../hooks/usePreferencesStore'
import {
  useDashboardUiStore,
  useCompareMode,
  usePrivacyMode,
} from '../../../hooks/useDashboardUiStore'
import { useExportData } from '@/hooks/useExportData'
import { formatCurrency } from '@/lib/helpers'
import { GoalEditDialog } from '../../card/GoalEditDialog'
import { EarningsCardBoundary } from '../../errors'
import { EarningsCard } from './EarningsCard'
import { useDashboardRange } from '../shared/DashboardRangeContext'

function periodShort(label: string): string {
  return label.split(' ').slice(-1)[0] ?? label
}

export function EarningsSection() {
  const { data } = useDashboardData()
  const { range, dateRange, prevRange } = useDashboardRange()
  const { workEntries, clients } = data
  const router = useRouter()

  const filtered = useFilteredEntries(workEntries, dateRange)
  const prevFiltered = useFilteredEntries(workEntries, prevRange)
  const realFiltered = filtered.filter((entry) => (entry.entry_kind ?? 'real') === 'real')
  const realPrevFiltered = prevFiltered.filter((entry) => (entry.entry_kind ?? 'real') === 'real')
  const totals = useDashboardTotals(realFiltered, clients)
  const trend = useEarningsTrend(realFiltered, realPrevFiltered, clients)
  const sparklineData = useEarningsSparkline(realFiltered, clients)
  const prevSparklineData = useEarningsSparkline(realPrevFiltered, clients)
  const periodLabel = usePeriodLabel(range)
  const eurRate = useEffectiveEurRate()
  const eurRateForExport = usePreferencesStore(selectEurRate)
  const currentGoal = useGoal()

  const privacyMode = usePrivacyMode()
  const compareMode = useCompareMode()
  const togglePrivacy = useDashboardUiStore((s) => s.togglePrivacy)
  const toggleCompare = useDashboardUiStore((s) => s.toggleCompare)

  const { exportCSV, exportPDF, isExporting } = useExportData({
    entries: filtered,
    clients,
    eurRate: eurRateForExport,
    periodLabel,
  })

  const [goalDialogOpen, setGoalDialogOpen] = useState(false)

  const totalEUR = eurRate > 0 ? totals.totalEarningsAllPLN / eurRate : 0
  const projectedEntries = filtered.filter((entry) => (entry.entry_kind ?? 'real') === 'predicted')
  const projectedTotals = useDashboardTotals(projectedEntries, clients)

  const handleExportCsv = useCallback(() => {
    try {
      exportCSV()
      toast.success('Eksport CSV wygenerowany')
    } catch (e) {
      toast.error('Nie udało się wygenerować CSV')
    }
  }, [exportCSV])

  const handleExportPdf = useCallback(() => {
    void (async () => {
      try {
        await exportPDF()
        toast.success('Raport PDF gotowy do pobrania')
      } catch {
        toast.error('Nie udało się wygenerować PDF')
      }
    })()
  }, [exportPDF])

  const handleOpenAnalytics = useCallback(() => {
    router.push('/dashboard?view=analytics')
    toast.message('Otwieram szczegółową analitykę')
  }, [router])

  const handleSetGoal = useCallback(() => {
    setGoalDialogOpen(true)
  }, [])

  const handleCopyAmount = useCallback(() => {
    const formatted = formatCurrency(totals.totalEarningsAllPLN, 'PLN')
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Schowek niedostępny')
      return
    }
    void navigator.clipboard
      .writeText(formatted)
      .then(() => toast.success(`Skopiowano: ${formatted}`))
      .catch(() => toast.error('Nie udało się skopiować'))
  }, [totals.totalEarningsAllPLN])

  return (
    <>
      <EarningsCardBoundary>
        <EarningsCard
          totalPLN={totals.totalEarningsAllPLN}
          totalEUR={totalEUR}
          trend={trend}
          sparklineData={sparklineData}
          prevSparklineData={prevSparklineData}
          periodLabel={periodShort(periodLabel) || 'okres'}
          privacyMode={privacyMode}
          compareMode={compareMode}
          isExporting={isExporting}
          onTogglePrivacy={togglePrivacy}
          onToggleCompare={toggleCompare}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          onOpenAnalytics={handleOpenAnalytics}
          onSetGoal={handleSetGoal}
          onCopyAmount={handleCopyAmount}
        />
      </EarningsCardBoundary>
      <p className="mt-2 text-sm text-muted-foreground">
        Przewidywane zarobki: <span className="font-medium text-foreground">{formatCurrency(projectedTotals.totalEarningsAllPLN, 'PLN')}</span>
      </p>

      <GoalEditDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        initialGoal={currentGoal}
      />
    </>
  )
}
