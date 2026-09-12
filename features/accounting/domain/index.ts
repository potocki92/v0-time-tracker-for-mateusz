/**
 * Czysta logika wykazu dla ksiegowej: bez Reacta, bez Supabase, bez UI.
 *
 * Wszystko tutaj jest testowalne wprost — patrz `__test__/accounting/`.
 * Warstwa transportowa (`services/`) i prezentacja (`components/`) tylko
 * z tego korzystaja.
 */
export { buildStatementModel } from './statement'
export {
  ALL,
  type AccountingDataset,
  type DateKey,
  type StatementClientRef,
  type StatementCurrencyTotal,
  type StatementEntryRow,
  type StatementFilters,
  type StatementInvoiceRow,
  type StatementModel,
  type StatementParty,
  type StatementPeriodPreset,
  type StatementProjectRef,
  type StatementQuarterTotal,
  type StatementRange,
  type StatementRow,
  type StatementWorksite,
} from './types'
export type { StatementDocumentLabels } from './labels'
export {
  DEFAULT_STATEMENT_PRESET,
  STATEMENT_PERIOD_PRESETS,
  quarterOfMonth,
  rangeOf,
  resolveStatementRange,
  todayKey,
  workWindowOf,
} from './range'
export { buildStatementCsv, formatPartyAddress, statementFileName } from './export'
