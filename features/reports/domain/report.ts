import { compareKpis } from './compare'
import {
  applyDimensionFilters,
  buildPerformedWorkRecords,
  collectTags,
  selectRange,
} from './dataset'
import { buildAllBreakdowns } from './breakdowns'
import { buildHeatmap, buildInsights } from './insights'
import { computeKpis } from './metrics'
import { previousRange, rangeOf, spanInDays } from './range'
import { buildTrend } from './trend'
import {
  REPORT_BASE_CURRENCY,
  type DateKey,
  type ReportFilters,
  type ReportModel,
  type ReportsDataset,
} from './types'

/**
 * Sklada CALY model widoku raportu z surowego datasetu i filtrow.
 *
 * To jedyne miejsce, w ktorym dataset jest filtrowany. Kazda sekcja UI dostaje
 * gotowe liczby, wiec nie ma szansy, zeby dwa kafelki policzyly to samo inaczej
 * ani zeby ktorykolwiek komponent przeszedl po calym zbiorze drugi raz.
 *
 * Funkcja jest czysta: brak Reacta, brak Supabase, brak `new Date()`.
 * „Dzisiaj" wchodzi argumentem, wiec ten sam wynik da sie odtworzyc w tescie.
 */
export function buildReportModel(
  dataset: ReportsDataset,
  filters: ReportFilters,
  today: DateKey,
): ReportModel {
  const range = rangeOf(filters, today)
  const previous = filters.compare ? previousRange(range) : null

  const performed = buildPerformedWorkRecords(
    dataset.entries,
    dataset.clients,
    dataset.projects,
    dataset.eurRate,
  )
  const filtered = applyDimensionFilters(performed, filters)
  const records = selectRange(filtered, range)
  const kpis = computeKpis(records)

  const previousRecords = previous ? selectRange(filtered, previous) : []

  return {
    range,
    spanDays: spanInDays(range),
    currency: REPORT_BASE_CURRENCY,
    eurRate: dataset.eurRate,
    records,
    kpis,
    comparison: previous
      ? compareKpis(kpis, computeKpis(previousRecords), previous)
      : null,
    trend: buildTrend(range, records, previous ? { range: previous, records: previousRecords } : null),
    breakdowns: buildAllBreakdowns(records),
    insights: buildInsights(records, range),
    heatmap: buildHeatmap(records, range),
    // Tagi bierzemy z calego pobranego okna, a nie z `records` — inaczej wybor
    // tagu wyczyscilby liste wszystkich pozostalych tagow.
    availableTags: collectTags(performed),
    datasetIsEmpty: performed.length === 0,
  }
}
