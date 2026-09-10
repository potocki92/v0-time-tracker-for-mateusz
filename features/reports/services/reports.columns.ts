/**
 * Jawne listy kolumn zapytan raportu.
 *
 * Raport ma WLASNE listy, nie pozyczone z dashboardu, bo czyta inny zbior pol:
 * potrzebuje `source` (manual/automation) i `project.client_id` (kaskada
 * „klient → jego projekty"), a nie potrzebuje `notes` — najciezszego pola
 * wpisu, ktorego zaden widok raportu nie pokazuje.
 */

/**
 * Wpisy pracy. Swiadomie pominiete:
 *   `notes`    — raport nie wyswietla tresci notatek, a to najciezsze pole wiersza,
 *   `user_id`  — scoping robi RLS,
 *   `category` — martwe pole, nikt go nie czyta.
 *
 * `status` i `entry_kind` zostaja mimo filtra w zapytaniu: to one pozwalaja
 * `isPerformedWork` potwierdzic invariant po stronie domeny.
 */
export const REPORTS_WORK_ENTRY_COLUMNS =
  'id, client_id, project_id, date, status, entry_kind, source, hours, quantity, quantity_from, quantity_to, tags, billing_rate, billing_currency, billing_work_type, billing_unit'

/** Klienci w roli fallbacku rozliczenia (`lib/finance`) i etykiety breakdownu. */
export const REPORTS_CLIENT_COLUMNS = 'id, name, rate, currency, work_type'

/**
 * Projekty w roli etykiety i kaskady filtrow — stad `client_id`.
 * `address` jest miejscem wykonywania pracy w zestawieniu dla ksiegowej.
 */
export const REPORTS_PROJECT_COLUMNS = 'id, name, client_id, address'

/**
 * Sufity odczytu. Zakres raportu jest zawezony datami, wiec limit jest
 * bezpiecznikiem na wypadek bledu w liczeniu okna, a nie normalna sciezka:
 * rok pracy to ok. 400 wierszy, a najdluzszy preset ma 12 miesiecy.
 */
export const REPORTS_MAX_WORK_ENTRIES = 5_000
export const REPORTS_MAX_CLIENTS = 500
export const REPORTS_MAX_PROJECTS = 500

/** Kurs awaryjny, gdy konto nie ma jeszcze zapisanej preferencji. */
export const REPORTS_FALLBACK_EUR_RATE = 4.3
