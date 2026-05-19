-- Agregacja miesięczna wpisów pracy jako RPC (Supabase / PostgreSQL).
-- Użycie:
--   select * from public.get_monthly_work_earnings(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     '2026-05-01'::date,
--     '2026-06-01'::date
--   );
--
-- p_month_start: pierwszy dzień miesiąca (inclusive)
-- p_month_end: pierwszy dzień kolejnego miesiąca (exclusive)

create or replace function public.get_monthly_work_earnings(
  p_user_id uuid,
  p_month_start date,
  p_month_end date
)
returns table (
  worked_days bigint,
  total_hours numeric,
  realized_earnings_pln numeric,
  predicted_earnings_pln numeric,
  total_earnings_pln numeric
)
language sql
stable
as $$
  with scoped_entries as (
    select
      we.date,
      we.status,
      coalesce(we.hours, 0) as hours,
      coalesce(
        case
          when we.status <> 'worked' then 0
          when we.billing_work_type = 'piecework'
            then coalesce(we.billing_rate, 0) * coalesce(we.quantity, 0)
          else
            coalesce(we.billing_rate, 0) * coalesce(we.hours, 0)
        end, 0
      ) as amount_native,
      coalesce(we.billing_currency, 'PLN') as billing_currency
    from public.work_entries we
    where we.user_id = p_user_id
      and we.date >= p_month_start
      and we.date < p_month_end
  ),
  normalized as (
    select
      date,
      status,
      hours,
      case
        when billing_currency = 'EUR'
          then amount_native * coalesce((select p.eur_to_pln from public.profiles p where p.id = p_user_id), 0)
        else amount_native
      end as amount_pln
    from scoped_entries
  )
  select
    count(*) filter (where status = 'worked') as worked_days,
    coalesce(sum(hours) filter (where status = 'worked'), 0) as total_hours,
    coalesce(sum(amount_pln) filter (where status = 'worked' and date <= current_date), 0) as realized_earnings_pln,
    coalesce(sum(amount_pln) filter (where status = 'worked' and date > current_date), 0) as predicted_earnings_pln,
    coalesce(sum(amount_pln) filter (where status = 'worked'), 0) as total_earnings_pln
  from normalized;
$$;

