'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDashboardData } from '../../_hooks'
import { useFilteredEntries } from '../../_hooks/useFilteredEntries'
import { useEarningsTrend } from '../../_hooks/useEarningsTrend'
import { useEarningsSparkline } from '../../_hooks/useEarningsSparkline'
import { usePeriodLabel } from '../../_hooks/usePeriodLabel'
import { useDashboardTotals } from '../../_hooks/useDashboardTotal'
import {
  selectEurRate,
  useEffectiveEurRate,
  usePreferencesStore,
  useGoal,
} from '../../_hooks/usePreferencesStore'
import {
  useDashboardUiStore,
  useCompareMode,
  usePrivacyMode,
} from '../../_hooks/useDashboardUiStore'
import { useExportData } from '@/hooks/useExportData'
import { formatCurrency } from '@/lib/helpers'
import { getTodayLocalDateString } from '@/lib/helpers'
import { calculateEarnings } from '@/lib/finance/earnings'
import { GoalEditDialog } from '../card/GoalEditDialog'
import { EarningsCardBoundary } from '../errors'
import { EarningsCard } from '../linear'
import { useDashboardRange } from './DashboardRangeContext'

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
  const prevRealFiltered = prevFiltered.filter((entry) => (entry.entry_kind ?? 'real') === 'real')
  const totals = useDashboardTotals(realFiltered, clients)
  const trend = useEarningsTrend(realFiltered, prevRealFiltered, clients)
  const sparklineData = useEarningsSparkline(realFiltered, clients)
  const prevSparklineData = useEarningsSparkline(prevRealFiltered, clients)
  const periodLabel = usePeriodLabel(range)
  const eurRate = useEffectiveEurRate()
  const eurRateForExport = usePreferencesStore(selectEurRate)
  const currentGoal = useGoal()

  const privacyMode = usePrivacyMode()
  const compareMode = useCompareMode()
  const togglePrivacy = useDashboardUiStore((s) => s.togglePrivacy)
  const toggleCompare = useDashboardUiStore((s) => s.toggleCompare)

  const { exportCSV, exportPDF, isExporting } = useExportData({
    entries: realFiltered,
    clients,
    eurRate: eurRateForExport,
    periodLabel,
  })

  const [goalDialogOpen, setGoalDialogOpen] = useState(false)

  const totalEUR = eurRate > 0 ? totals.totalEarningsAllPLN / eurRate : 0
  const todayIso = getTodayLocalDateString()
  const realizedPLN = realFiltered
    .filter((entry) => entry.status === 'worked' && entry.date <= todayIso)
    .reduce((sum, entry) => {
      const client = clients.find((c) => c.id === entry.client_id)
      return sum + calculateEarnings(entry, client, eurRate).amountInPLN
    }, 0)
  const predictedPLN = filtered
    .filter((entry) => (entry.entry_kind ?? 'real') === 'predicted' && entry.status === 'worked')
    .reduce((sum, entry) => {
      const client = clients.find((c) => c.id === entry.client_id)
      return sum + calculateEarnings(entry, client, eurRate).amountInPLN
    }, 0)

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
      <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Realnie na dziś: <span className="font-medium text-foreground">{formatCurrency(realizedPLN, 'PLN')}</span>
        {' · '}
        Prognoza na ten miesiąc: <span className="font-medium text-foreground">{formatCurrency(predictedPLN, 'PLN')}</span>
      </div>

      <GoalEditDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        initialGoal={currentGoal}
      />
    </>
  )
}
