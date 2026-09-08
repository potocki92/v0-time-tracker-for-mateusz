/**
 * Publiczne API serwerowe modulu Work Automation.
 *
 * Wola je wylacznie route handler crona — sekrety i klucz service-role nie
 * opuszczaja serwera.
 */
export { runWorkAutomation, type AutomationRunSummary } from './services/workAutomation.runner.server'
