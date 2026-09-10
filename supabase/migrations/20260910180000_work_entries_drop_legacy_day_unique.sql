-- Wpis rzeczywisty i planowany moga wspolistniec w jednym dniu.
--
-- Migracja 20260818185320 miala zdjac stara regule „najwyzej jeden wpis na
-- dzien", ale chybila dwa razy naraz:
--   * szukala nazwy `work_entries_user_id_date_key`, a w produkcji regula
--     nazywa sie `uq_work_entries_user_date`,
--   * szukala OGRANICZENIA, podczas gdy w bazie lezy INDEKS — `ALTER TABLE …
--     DROP CONSTRAINT` nie dotyka indeksow niepodpartych ograniczeniem.
-- `IF EXISTS` zamienil obie pomylki w cisze, wiec nowe UNIQUE (user_id, date,
-- entry_kind) doszlo OBOK starego i do dzis obowiazuja oba naraz — a wezsze
-- wygrywa.
--
-- Skutek dla automatu zapisu pracy: dla dnia z samym planem `decideDay` slusznie
-- decydowalo „utworz wpis rzeczywisty", ale insert konczyl sie bledem 23505,
-- ktory `insertAutomationEntry` interpretuje jako konflikt. Dziennik zapisywal
-- wtedy `skipped / entry_exists` i — bo pominiecie zamyka date na stale —
-- automat nie tworzyl juz nigdy zadnego wpisu.
--
-- Tym razem szukamy po KSZTALCIE, nie po nazwie: kazdy unikalny indeks
-- dokladnie na (user_id, date), wraz z ograniczeniem, jesli jakies za nim stoi.
-- Indeksy czesciowe i wyrazeniowe zostawiamy — takie nie moglyby wywolac tego
-- bledu, a moglyby pelnic inna, celowa role.

DO $$
DECLARE
  legacy RECORD;
BEGIN
  FOR legacy IN
    SELECT
      i.indexrelid::regclass::text AS index_name,
      con.conname                  AS constraint_name
    FROM pg_index i
    LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid
    WHERE i.indrelid = 'public.work_entries'::regclass
      AND i.indisunique
      AND i.indpred  IS NULL          -- nie ruszamy indeksow czesciowych
      AND i.indexprs IS NULL          -- ani wyrazeniowych
      AND (
        -- `attname` jest typu `name`, wiec bez rzutowania nie porowna sie z `text[]`.
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(i.indkey::smallint[]) AS key(attnum)
        JOIN pg_attribute a
          ON a.attrelid = i.indrelid AND a.attnum = key.attnum
      ) = ARRAY['date', 'user_id']
  LOOP
    IF legacy.constraint_name IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE public.work_entries DROP CONSTRAINT %I',
        legacy.constraint_name
      );
    ELSE
      EXECUTE format('DROP INDEX %s', legacy.index_name);
    END IF;
  END LOOP;
END $$;

-- Regula wlasciwa — gwarancja „najwyzej jeden wpis danego rodzaju na dzien".
-- Produkcja ma ja pod nazwa `work_entries_user_id_date_entry_kind_key`; ten blok
-- jest dla baz, ktore nie dostaly migracji 20260818185320.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = 'public.work_entries'::regclass
      AND i.indisunique
      AND i.indpred  IS NULL
      AND i.indexprs IS NULL
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(i.indkey::smallint[]) AS key(attnum)
        JOIN pg_attribute a
          ON a.attrelid = i.indrelid AND a.attnum = key.attnum
      ) = ARRAY['date', 'entry_kind', 'user_id']
  ) THEN
    ALTER TABLE public.work_entries
      ADD CONSTRAINT work_entries_user_id_date_entry_kind_key
      UNIQUE (user_id, date, entry_kind);
  END IF;
END $$;
