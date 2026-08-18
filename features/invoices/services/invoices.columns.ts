/**
 * Jawne listy kolumn dla zapytań modułu Faktury.
 *
 * Współdzielone przez wariant serwerowy i kliencki — prefetch i refetch po
 * hydracji muszą zwrócić ten sam kształt wiersza.
 *
 * UWAGA: `Invoice` z `@/lib/types` deklaruje jeszcze `month` i `year`, ale te
 * kolumny nie istnieją w bazie (żadna migracja ich nie zakłada). Wypisanie ich
 * tutaj skończyłoby się błędem 400 z PostgREST — dlatego ich nie ma.
 */

/**
 * Faktury. Moduł renderuje z tego PDF, eksport księgowy i panel szczegółów,
 * więc korzysta z niemal całego wiersza. Świadomie pominięte: `user_id`
 * (scoping robi RLS / `.eq('user_id')`), `note` (legacy, zastąpione przez
 * `notes` migracją `invoices_upgrade`) i `updated_at` (bez konsumenta).
 */
export const INVOICES_INVOICE_COLUMNS =
  'id, client_id, name, invoice_number, recipient, description, billing_period, issue_date, invoice_date, due_date, amount, net_amount, vat_amount, gross_amount, currency, is_paid, paid_date, status, file_url, notes, template_key, template_accent_color, template_footer, auto_generated, period_start, period_end, created_at'

/**
 * Klienci — blok nabywcy na fakturze potrzebuje pełnych danych adresowych
 * i identyfikacyjnych. Pomijamy `user_id`, `updated_at` i `reminders_enabled`.
 */
export const INVOICES_CLIENT_COLUMNS =
  'id, name, nip, regon, address, city, postal_code, region, country_code, phone, email, website, locale, timezone, work_type, rate, currency, unit, is_default, auto_invoice_enabled, auto_invoice_frequency, color, created_at'

/**
 * Pozycje faktury. Bez `user_id` (scoping robi RLS) i bez znaczników czasu —
 * widok pokazuje wyłącznie treść pozycji i wyliczone kwoty.
 */
export const INVOICE_LINE_ITEM_COLUMNS =
  'id, invoice_id, position, description, unit, quantity, unit_price_net, vat_rate, net_amount, vat_amount, gross_amount'

/**
 * Bezpieczniki — jawny sufit zamiast odczytu rosnącego liniowo z historią.
 * Lista faktur jest sortowana malejąco po `issue_date`, więc sufit obcina
 * najstarsze pozycje, nie najnowsze.
 */
export const INVOICES_MAX_INVOICES = 2_000
export const INVOICES_MAX_CLIENTS = 500
export const INVOICES_MAX_LINE_ITEMS = 500
