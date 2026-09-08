/**
 * Czysta logika automatu: reguly dat, grafiku i zjazdow oraz walidacja.
 * Bez Reacta, bez bazy, bez ukrytego odczytu zegara.
 */
export * from './workAutomation.types'
export {
  DEFAULT_RUN_TIME,
  ERROR_REASON_LABELS,
  PRESENCE_LABELS,
  DEFAULT_TIME_ZONE,
  DEFAULT_WEEK_SCHEDULE,
  MAX_AUTOMATION_USERS,
  MAX_CATCHUP_DAYS,
  PREVIEW_DAYS,
  SKIP_REASON_LABELS,
  TIME_ZONE_OPTIONS,
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
} from './workAutomation.constants'
export { mergeTripRanges, resolvePresence } from './workAutomation.presence'
export {
  decideDay,
  hasWorkingDay,
  isDue,
  nextRunInstant,
  planDays,
  weekdayKeyOf,
} from './workAutomation.decide'
export {
  resumeWorkSchema,
  workAutomationSettingsSchema,
  type WorkAutomationSettingsInput,
} from './workAutomation.schema'
