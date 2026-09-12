/**
 * Jawne listy kolumn zapytan wykazu.
 *
 * Modul ma WLASNE listy, nie pozyczone z faktur ani z raportu: czyta blok
 * adresowy klienta (bo odpowiada na pytanie „dla kogo"), adres projektu
 * („gdzie") i z wpisow pracy wylacznie date, projekt i godziny — bez notatek,
 * tagow i stawek, ktorych wykaz nie pokazuje.
 */

/**
 * Faktury. Swiadomie pominiete: `name`, `billing_period` (tekst opisowy,
 * zastapiony przez `period_start`/`period_end`), `file_url`, `notes`, pola
 * szablonu PDF i `user_id` (scoping robi RLS).
 *
 * `issue_date` ZOSTAJE obok `invoice_date`: starsze wiersze maja wypelniona
 * tylko te pierwsza.
 */
export const STATEMENT_INVOICE_COLUMNS =
  'id, client_id, invoice_number, recipient, description, issue_date, invoice_date, due_date, period_start, period_end, amount, net_amount, vat_amount, gross_amount, currency, is_paid, paid_date, status'

/** Klienci w roli NABYWCY — stad komplet pol adresowych i NIP / USt-IdNr. */
export const STATEMENT_CLIENT_COLUMNS =
  'id, name, nip, address, city, postal_code, country_code'

/** Projekty w roli MIEJSCA pracy — `address` jest tu kolumna kluczowa. */
export const STATEMENT_PROJECT_COLUMNS = 'id, name, client_id, address'

/**
 * Wpisy pracy. Wykaz lokalizuje okres faktury, wiec nie potrzebuje ani stawek,
 * ani tagow, ani notatek. `status` i `entry_kind` zostaja, zeby domena mogla
 * potwierdzic „wykonana praca" po swojej stronie.
 */
export const STATEMENT_WORK_ENTRY_COLUMNS =
  'id, client_id, project_id, date, status, entry_kind, hours'

/**
 * Sufity odczytu — bezpiecznik na wypadek bledu w liczeniu zakresu, a nie
 * normalna sciezka: rok fakturowania to kilkadziesiat dokumentow, a rok pracy
 * ok. 400 wpisow.
 */
export const STATEMENT_MAX_INVOICES = 2_000
export const STATEMENT_MAX_WORK_ENTRIES = 5_000
export const STATEMENT_MAX_CLIENTS = 500
export const STATEMENT_MAX_PROJECTS = 500
