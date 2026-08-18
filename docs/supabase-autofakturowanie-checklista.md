# Supabase – checklista pod auto‑fakturowanie

Poniżej jest minimalny zestaw rzeczy, które muszą istnieć w Supabase, żeby auto‑fakturowanie i testowe tworzenie faktur działały poprawnie.

## 1) Tabele i kolumny

Migracje żyją w `supabase/migrations/` i są aplikowane przez Supabase CLI
(`npx supabase db reset` lokalnie, `npx supabase db push` na zdalną bazę) —
kolejność wynika ze znaczników czasu w nazwach plików. Za auto‑fakturowanie
odpowiadają:

1. `*_create_tables.sql`
2. `*_invoices_upgrade.sql`
3. `*_invoice_automation_and_templates.sql`
4. `*_invoice_sequence_reservation.sql`
5. `*_client_auto_invoicing.sql`

Najważniejsze obiekty po migracji:

- `public.invoices` (kolumny m.in. `invoice_number`, `recipient`, `due_date`, `template_key`, `auto_generated`, `period_start`, `period_end`).
- `public.clients` (kolumny `auto_invoice_enabled`, `auto_invoice_frequency`).
- `public.work_entries` (snapshot billingu: `billing_rate`, `billing_work_type`, itd.).
- `public.invoice_sequence_counters` (licznik numeracji faktur).

## 2) RPC do numeracji faktur

Musi istnieć funkcja:

- `public.reserve_invoice_sequence(p_user_id uuid, p_prefix text, p_issue_date date)`

Uprawnienia:

- `GRANT EXECUTE` dla roli `authenticated`.

## 3) Ograniczenia i indeksy (krytyczne)

- Unikalność numeru faktury per użytkownik:
  - `idx_invoices_user_invoice_number_unique` (partial unique index).
- Indeks pod auto‑faktury:
  - `idx_invoices_auto_generated_period`.
- Indeks pod klientów auto‑fakturowania:
  - `idx_clients_auto_invoice`.

## 4) RLS

Dla tabel `clients`, `work_entries`, `invoices` muszą być aktywne polityki `*_select_own`, `*_insert_own`, `*_update_own`, `*_delete_own` oparte o `auth.uid() = user_id`.

## 5) Storage (opcjonalnie dla PDF)

Dla samego testu tworzenia rekordu faktury PDF nie jest wymagany.

Jeżeli chcesz upload PDF, skonfiguruj bucket `invoices` zgodnie z logiką aplikacji (`services/invoices.ts`).

---

## Szybki test w Supabase SQL Editor

> Podmień `YOUR_USER_ID` na realne UUID użytkownika.

```sql
-- Czy są wymagane kolumny auto-fakturowania?
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'invoices'
  and column_name in ('invoice_number', 'auto_generated', 'period_start', 'period_end', 'template_key');

-- Czy jest funkcja do numeracji?
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'reserve_invoice_sequence';

-- Test ręczny: dodanie faktury (bez PDF)
insert into public.invoices (
  user_id,
  name,
  invoice_date,
  issue_date,
  amount,
  currency,
  is_paid,
  billing_period,
  auto_generated
)
values (
  'YOUR_USER_ID'::uuid,
  'Test SQL faktura',
  current_date,
  current_date,
  1,
  'PLN',
  false,
  'Q1 2026',
  false
);

-- Weryfikacja: czy rekord wpadł do listy faktur?
select id, name, invoice_number, amount, currency, created_at
from public.invoices
where user_id = 'YOUR_USER_ID'::uuid
order by created_at desc
limit 20;
```

## Szybki test z UI

Na stronie **Faktury** użyj nowego przycisku **„Utwórz testową fakturę”**.

Oczekiwany rezultat:

1. Pojawi się toast o dodaniu faktury.
2. Na liście faktur pojawi się rekord o nazwie `Faktura testowa YYYY-MM-DD`.
3. Rekord jest tworzony bez PDF (pole `file_url` może być `null`).
