/**
 * Jawne listy kolumn dla zapytań dashboardu.
 *
 * Gwiazdka w select ciągnęła cały wiersz — razem z polami, których dashboard
 * ani raporty nigdy nie czytają. Poniższe listy to dokładnie to, co konsumuje
 * warstwa widoku; każda dołożona kolumna powinna mieć konsumenta w kodzie.
 *
 * Współdzielone przez wariant serwerowy i kliencki, żeby refetch po hydracji
 * dostał ten sam kształt wiersza co prefetch — inaczej React Query podmieniłby
 * dane na inny zbiór pól.
 */

/**
 * Wpisy pracy. Świadomie pominięte:
 *   `user_id`    — scoping robi RLS / `.eq('user_id')`, widok go nie czyta,
 *   `category`   — martwe pole, nikt go nie wyświetla ani nie filtruje,
 *   `note`       — legacy z migracji `create_tables`; aplikacja pisze `notes`,
 *   `updated_at` — nieużywane nigdzie w repo.
 *
 * `notes` i `tags` MUSZĄ tu zostać mimo że są to najcięższe pola:
 *   `notes` czyta ActivitySection / ProjectsSection / UpcomingSection,
 *   `tags`  czyta moduł raportów (filtr po tagu + eksport CSV), który jedzie
 *           na tym samym `useDashboardData()`.
 */
export const DASHBOARD_WORK_ENTRY_COLUMNS =
  'id, client_id, project_id, date, status, entry_kind, hours, quantity, quantity_from, quantity_to, tags, notes, billing_rate, billing_currency, billing_work_type, billing_unit, created_at'

/**
 * Faktury. Dashboard pokazuje listę otwartych pozycji i liczy z nich KPI —
 * nie potrzebuje bloku szablonu PDF (`template_*`), pól automatyzacji
 * (`auto_generated`, `period_*`), `file_url` ani `notes`.
 */
export const DASHBOARD_INVOICE_COLUMNS =
  'id, name, invoice_number, recipient, issue_date, invoice_date, due_date, amount, currency, is_paid, status, created_at'

/**
 * Klienci. Dashboard używa ich jako mapy id → nazwa/kolor/stawka (fallback
 * wyliczeń w `lib/finance`) plus NIP w tygodniowym podsumowaniu dla księgowej.
 * Cały blok adresowo-kontaktowy zostaje w bazie.
 */
export const DASHBOARD_CLIENT_COLUMNS =
  'id, name, nip, color, rate, currency, work_type, unit, is_default'

/**
 * Projekty. Jedyny konsument to `buildWeeklySummary` (miejsce wykonywania
 * pracy) i etykiety w raportach — czyli nazwa i adres.
 */
export const DASHBOARD_PROJECT_COLUMNS = 'id, name, address'

/**
 * Bezpieczniki. Okno 24 miesięcy (`getWorkEntriesWindowStart`) i tak ogranicza
 * wpisy pracy, ale jawny limit sprawia, że błąd w liczeniu okna nie ściągnie
 * całej historii do przeglądarki. Wartości są z dużym zapasem ponad realny
 * wolumen (24 mies. × 2 rodzaje wpisu na dzień ≈ 1460 wierszy).
 */
export const DASHBOARD_MAX_WORK_ENTRIES = 5_000
export const DASHBOARD_MAX_INVOICES = 2_000
export const DASHBOARD_MAX_CLIENTS = 500
export const DASHBOARD_MAX_PROJECTS = 500
