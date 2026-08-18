/**
 * Jawne listy kolumn dla zapytań modułu Klienci.
 *
 * Współdzielone przez wariant serwerowy i kliencki — prefetch i refetch po
 * hydracji muszą zwrócić ten sam kształt wiersza.
 */

/**
 * Klienci. Tu, w odróżnieniu od dashboardu, potrzebny jest praktycznie cały
 * wiersz: formularz edycji (`toClientFormValues`) czyta blok adresowy,
 * kontaktowy, lokalizacyjny i rozliczeniowy, a lista sortuje m.in. po
 * `created_at`.
 *
 * Świadomie pominięte: `user_id` (scoping robi RLS / `.eq('user_id')`),
 * `updated_at` i `reminders_enabled` — żadne z nich nie ma konsumenta w repo.
 */
export const CLIENTS_CLIENT_COLUMNS =
  'id, name, nip, regon, address, city, postal_code, region, country_code, phone, email, website, locale, timezone, work_type, rate, currency, unit, is_default, auto_invoice_enabled, auto_invoice_frequency, color, created_at'

/**
 * Wpisy pracy — moduł liczy z nich statystyki klienta (godziny, dni, zarobek),
 * więc potrzebuje pól rozliczeniowych. Nie potrzebuje `notes`, `tags`,
 * `category`, `note` ani znaczników czasu.
 */
export const CLIENTS_WORK_ENTRY_COLUMNS =
  'id, client_id, project_id, date, status, entry_kind, hours, quantity, quantity_from, quantity_to, billing_rate, billing_currency, billing_work_type'

/** Historia stawek — cały wiersz jest wyświetlany na osi czasu stawek. */
export const CLIENTS_CLIENT_RATE_COLUMNS =
  'id, client_id, rate, currency, work_type, unit, effective_from, note, created_at'

/**
 * Bezpieczniki — jawne górne ograniczenie, żeby odczyt nie rósł liniowo
 * z historią. Wartości z dużym zapasem ponad realny wolumen jednego konta.
 */
export const CLIENTS_MAX_CLIENTS = 500
export const CLIENTS_MAX_WORK_ENTRIES = 5_000
export const CLIENTS_MAX_CLIENT_RATES = 2_000
