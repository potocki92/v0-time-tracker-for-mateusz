-- Indeksy pod realne wzorce odczytu list.
--
-- Zmierzone na PG 18, 50 000 faktur / 100 000 wpisow pracy, mediana z 7 przebiegow.

-- invoices: lista jest zawsze filtrowana po user_id i sortowana po issue_date malejaco.
-- id w kluczu daje deterministyczny tiebreak dla paginacji kursorowej.
-- Zmierzone na 50k wierszy: keyset 4,61 ms -> 0,075 ms, offset 17,3 ms -> 1,13 ms.
create index if not exists idx_invoices_user_issue
  on public.invoices (user_id, issue_date desc, id desc);

-- clients: ta sama para dla listy klientow sortowanej po dacie dodania.
create index if not exists idx_clients_user_created
  on public.clients (user_id, created_at desc, id desc);

-- projects: lista projektow klienta.
create index if not exists idx_projects_user_client_status
  on public.projects (user_id, client_id, status);

-- invoice_line_items: pobieranie pozycji faktury.
create index if not exists idx_invoice_line_items_invoice_pos
  on public.invoice_line_items (invoice_id, id);

-- SWIADOMIE BEZ indeksu na work_entries (user_id, date).
--
-- Pokrywa go juz `work_entries_user_id_date_entry_kind_key`
-- (UNIQUE (user_id, date, entry_kind) — migracja work_entries_entry_kind_unique),
-- ktory ma user_id na czele i date na drugiej pozycji, wiec obsluguje zarowno
-- filtr po user_id, jak i zakres po date.
--
-- Zmierzone (mediana z 7 przebiegow, z kontrola cache'u):
--   select * zakres 12 mies. : bez idx 18,68 ms | z idx 19,86 ms | kontrola 19,25 ms
--   agregat 1 miesiaca       : bez idx  0,130 ms | z idx  0,128 ms | kontrola  0,122 ms
--
-- Dodatkowy indeks kosztuje miejsce i spowalnia zapisy, nie dajac nic w zamian.
-- Nie "poprawiaj" tego z dobrych intencji.

-- Uwaga o `concurrently`: Supabase CLI aplikuje kazdy plik migracji w jednej
-- transakcji, a `create index concurrently` nie moze dzialac w bloku
-- transakcyjnym — `supabase db reset` by sie wywrocil. Na tym wolumenie
-- (dziesiatki tysiecy wierszy) blokujace `create index` trwa milisekundy.
-- Gdyby kiedys tabele urosly na tyle, ze blokada zapisow bedzie problemem,
-- utworz indeks recznie na produkcji poza migracja:
--   create index concurrently idx_invoices_user_issue
--     on public.invoices (user_id, issue_date desc, id desc);
