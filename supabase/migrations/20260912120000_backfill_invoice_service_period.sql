-- Okres uslugi wraca z tekstu `billing_period` do kolumn `period_start`/`period_end`.
--
-- Do tej pory kolumny wypelniala WYLACZNIE sciezka autofakturowania. Faktury
-- wystawione recznie — w tym cala sciezka „z przepracowanych tygodni" — mialy
-- okres wypisany slownie w `billing_period` ("TYGODNIE 2026-08-24 - 2026-08-30"),
-- ale nie mialy go w danych.
--
-- Dla „Wykazu dla ksiegowej" to nie kosmetyka: `servicePeriodOf` czyta te dwie
-- kolumny i nic wiecej, a `buildWorksitesForInvoice` bez okresu wychodzi od razu
-- z pusta lista. Takie faktury pokazywaly „Brak okresu na fakturze", „Brak
-- zarejestrowanej pracy w tym okresie" i 0 h — mimo istniejacych wpisow pracy
-- z projektem i adresem.
--
-- Backfill obejmuje TYLKO etykiety, ktore niosa obie daty wprost
-- ("TYGODNIE <od> - <do>", "TYDZIEN <od> - <do>", "MIESIAC <od> - <do>").
-- Etykiety kwartalne ("Q3 2026") zostaja nietkniete: buduje je adapter
-- kreatora z DATY WYSTAWIENIA, wiec nie sa okresem wykonania, a podstawienie
-- ich wygladaloby jak dane, a byloby zgadywaniem. Takie wiersze wykaz nadal
-- zglasza w sekcji „Do uzupelnienia przed wyslaniem".
--
-- Nie nadpisujemy niczego: warunek wymaga, by OBIE kolumny byly puste.

WITH parsed AS (
  SELECT
    id,
    (regexp_match(
      billing_period,
      '(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(\d{4}-\d{2}-\d{2})'
    )) AS bounds
  FROM public.invoices
  WHERE period_start IS NULL
    AND period_end   IS NULL
    AND billing_period IS NOT NULL
)
UPDATE public.invoices AS i
SET
  -- LEAST/GREATEST, bo kolejnosc dat w tekscie pisal czlowiek, nie schemat.
  period_start = LEAST(   (p.bounds[1])::date, (p.bounds[2])::date),
  period_end   = GREATEST((p.bounds[1])::date, (p.bounds[2])::date)
FROM parsed p
WHERE i.id = p.id
  AND p.bounds IS NOT NULL;
