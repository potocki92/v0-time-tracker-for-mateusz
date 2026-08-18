-- Miesieczne KPI dashboardu liczone w bazie zamiast po stronie klienta.
-- Zmierzone: 1,56 ms i ~60 bajtow odpowiedzi zamiast 698 wierszy / 385 kB JSON.
--
-- `p_user_id` jest ostatnim parametrem i domyslnie `auth.uid()` — klient nie
-- musi (i nie powinien) go podawac.
--
-- `security invoker` jest tu istotne: funkcja dziala z uprawnieniami wolajacego,
-- wiec RLS na `work_entries` i `profiles` nadal obowiazuje. `security definer`
-- obszedlby RLS i zrobilby z tej funkcji dziure.
--
-- `set search_path = public` odcina podmiane schematu przez `search_path`
-- wolajacego.
--
-- UWAGA — funkcja NIE JEST jeszcze podpieta pod dashboard.
-- Porownanie z obecnym liczeniem w JS (lib/finance/totals.ts + realization.ts)
-- na scenariuszu kontrolnym rozjechalo sie, wiec zgodnie z bramka etapu
-- selektory w `features/dashboard` zostaja zrodlem prawdy. Zmierzone:
--
--   pole                    | RPC     | JS
--   worked_days             | 5       | 5
--   total_hours             | 31,50   | 31,5
--   realized_earnings_pln   | 3270,00 | 2845
--   predicted_earnings_pln  |  800,00 | 1600
--   total_earnings_pln      | 4070,00 | 4445
--
-- Trzy przyczyny, wszystkie do rozstrzygniecia przed podpieciem RPC:
--
--   1. Akord bez `quantity`: JS (lib/finance/quantity.ts) spada na
--      `quantity_to - quantity_from`, RPC bierze samo `we.quantity` i wychodzi 0.
--   2. Podzial realized/predicted: JS (isRealizedEntry) wymaga
--      `entry_kind = 'real' AND date <= dzis`, RPC patrzy wylacznie na date —
--      wpis `predicted` z data wsteczna laduje po zlej stronie.
--   3. Kurs EUR: JS bierze kurs z preferencji uzytkownika / live NBP
--      (usePreferencesStore), RPC bierze `profiles.eur_to_pln`. Te dwie
--      wartosci nie musza byc rowne.
create or replace function public.get_monthly_work_summary(
  p_month_start date,
  p_month_end   date,
  p_user_id     uuid default auth.uid()
)
returns table (
  worked_days            bigint,
  total_hours            numeric,
  realized_earnings_pln  numeric,
  predicted_earnings_pln numeric,
  total_earnings_pln     numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with scoped as (
    select
      we.date,
      we.status,
      coalesce(p.eur_to_pln, 0) as eur_to_pln,
      coalesce(we.hours, 0)     as hours,
      coalesce(case
        when we.status <> 'worked' then 0
        when we.billing_work_type = 'piecework'
          then coalesce(we.billing_rate, 0) * coalesce(we.quantity, 0)
        else coalesce(we.billing_rate, 0) * coalesce(we.hours, 0)
      end, 0)                   as amount_native,
      coalesce(we.billing_currency, 'PLN') as cur
    from public.work_entries we
    left join public.profiles p on p.id = we.user_id
    where we.user_id = p_user_id
      and we.date >= p_month_start
      and we.date <  p_month_end
  ), norm as (
    select date, status, hours,
      case when cur = 'EUR' then amount_native * eur_to_pln else amount_native end as amount_pln
    from scoped
  )
  select
    count(*) filter (where status = 'worked'),
    coalesce(sum(hours)      filter (where status = 'worked'), 0),
    coalesce(sum(amount_pln) filter (where status = 'worked' and date <= current_date), 0),
    coalesce(sum(amount_pln) filter (where status = 'worked' and date >  current_date), 0),
    coalesce(sum(amount_pln) filter (where status = 'worked'), 0)
  from norm;
$$;
