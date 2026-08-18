/**
 * Jawne listy kolumn dla zapytań kalendarza.
 *
 * Współdzielone przez wariant serwerowy (prefetch w page.tsx) i kliencki
 * (refetch po hydracji) — oba MUSZĄ zwracać ten sam kształt wiersza i ten sam
 * zbiór, inaczej React Query podmieniłby dane zaraz po wejściu na stronę.
 */

/**
 * Wpisy pracy. `billing_*` są potrzebne, bo `calculateEarnings`
 * (lib/finance/earnings.ts) liczy z nich kwotę wpisu; `notes` wyświetla
 * tooltip dnia, lista i sekcja ostatnich wpisów.
 *
 * Świadomie pominięte: `user_id` (scoping robi RLS), `category`, `tags`
 * i `billing_unit` (kalendarz ich nie pokazuje), `note` (legacy),
 * `created_at` / `updated_at` (kalendarz sortuje po `date`).
 */
export const CALENDAR_WORK_ENTRY_COLUMNS =
  'id, client_id, project_id, date, status, entry_kind, hours, quantity, quantity_from, quantity_to, notes, billing_rate, billing_currency, billing_work_type'

/**
 * Klienci — wybór w dialogu dnia plus fallback stawki dla wpisów bez snapshotu.
 * Blok adresowo-kontaktowy zostaje w bazie.
 */
export const CALENDAR_CLIENT_COLUMNS =
  'id, name, color, rate, currency, work_type, unit, is_default'

/** Projekty — select w dialogu, filtrowany po `client_id`. */
export const CALENDAR_PROJECT_COLUMNS = 'id, name, client_id, color'

/**
 * Bezpieczniki. Okno 24 miesięcy i tak ogranicza wpisy, ale jawny limit
 * sprawia, że błąd w liczeniu okna nie ściągnie całej historii.
 * 24 mies. × 2 rodzaje wpisu na dzień ≈ 1460 wierszy — 5000 to spory zapas.
 */
export const CALENDAR_MAX_WORK_ENTRIES = 5_000
export const CALENDAR_MAX_CLIENTS = 500
export const CALENDAR_MAX_PROJECTS = 500
