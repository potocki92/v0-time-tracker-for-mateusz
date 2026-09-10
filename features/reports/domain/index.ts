/**
 * Czysta logika raportu: bez Reacta, bez Supabase, bez komponentow.
 *
 * Wszystko tutaj jest testowalne wprost — patrz `__test__/reports/`.
 * Warstwa transportowa (`services/`) i UI (`components/`) tylko z tego korzystaja.
 */
export { buildReportModel } from './report'
export {
  ALL,
  type BreakdownDimension,
  type BreakdownItem,
  type ComparableMetric,
  type DateKey,
  type HeatmapDay,
  type MetricDelta,
  type MetricTrendStatus,
  type ReportClientRef,
  type ReportComparison,
  type ReportEntryRow,
  type ReportFilters,
  type ReportInsights,
  type ReportKpis,
  type ReportModel,
  type ReportPeriodPreset,
  type ReportProjectRef,
  type ReportRange,
  type ReportRecord,
  type ReportTrend,
  type ReportsDataset,
  type TrendBucketUnit,
  type TrendPoint,
  type WeekdayIndex,
  type WeekdayLoad,
} from './types'
export {
  DEFAULT_PERIOD_PRESET,
  REPORT_PERIOD_PRESETS,
  fetchWindowOf,
  previousRange,
  rangeOf,
  resolveReportRange,
  spanInDays,
  todayKey,
  weekdayIndex,
} from './range'
export { isBillable, isPerformedWork } from './dataset'
export { computeDelta } from './compare'
export { computeKpis } from './metrics'
export { projectAfterClientChange, projectsForClient } from './filters'
export { axisTickInterval, bucketKeyOf, buildTrend, resolveBucketUnit } from './trend'
export { buildBreakdown } from './breakdowns'
export { buildInsights, longestStreak } from './insights'
