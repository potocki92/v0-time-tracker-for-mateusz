/**
 * Jawne listy kolumn dla zapytań modułu Projekty.
 *
 * Współdzielone przez wariant serwerowy i kliencki — prefetch i refetch po
 * hydracji muszą zwrócić ten sam kształt wiersza.
 */

/**
 * Projekty. Formularz edycji czyta cały blok budżetowo-opisowy, karta na liście
 * kolor i status. Świadomie pominięte: `user_id` (scoping robi RLS / `.eq`),
 * `current_quantity` i `updated_at` — nikt ich nie czyta.
 */
export const PROJECTS_PROJECT_COLUMNS =
  'id, client_id, name, description, address, status, budget_type, budget_amount, target_quantity, priority, color, start_date, end_date, created_at'

/**
 * Klienci — tylko mapa id → nazwa/kolor plus stawka do wyliczenia
 * wykorzystania budżetu. Blok adresowo-kontaktowy zostaje w bazie.
 */
export const PROJECTS_CLIENT_COLUMNS = 'id, name, color, rate, work_type'

/**
 * Wpisy pracy — moduł sumuje godziny i kwoty per projekt, więc potrzebuje
 * `billing_rate` / `billing_work_type`. Nie potrzebuje `notes`, `tags`,
 * `category` ani znaczników czasu.
 */
export const PROJECTS_WORK_ENTRY_COLUMNS =
  'id, project_id, client_id, date, status, hours, quantity, billing_rate, billing_work_type'

/**
 * Bezpieczniki — jawne górne ograniczenie, żeby odczyt nie rósł liniowo
 * z historią.
 */
export const PROJECTS_MAX_PROJECTS = 500
export const PROJECTS_MAX_CLIENTS = 500
export const PROJECTS_MAX_WORK_ENTRIES = 5_000
