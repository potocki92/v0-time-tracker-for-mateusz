# Dashboard — uklad desktopowy

Dokument mierzy efekt refaktoru gridu na `/dashboard` (Etap 2).

## Metoda pomiaru

`document.documentElement.scrollHeight` przy czterech szerokosciach viewportu,
sidebar rozwiniety (`defaultOpen: true`), ta sama porcja danych w kazdym pomiarze.

Pomiar szedl przez tymczasowa trase-sonde (`app/layout-probe`), ktora renderuje
`AppShell` + `DashboardContent` z zaseedowanym `QueryClient`. Powod: srodowisko
robocze nie ma dockera, wiec `supabase start` nie wstaje, a `/dashboard` jest za
`redirect('/auth/login')`. Sonda daje te sama strukture DOM i te same style, tylko
z syntetycznym zestawem danych (3 klientow, 60 wpisow pracy, 6 faktur, 3 projekty).
Wartosci bezwzgledne beda wiec inne niz na produkcji — porownywalna jest RELACJA
przed/po, bo oba pomiary szly na tym samym zestawie.

Sonda jest kodem jednorazowym i nie jest commitowana.

## Baseline — przed refaktorem

Uklad: jedna kolumna, 15 sekcji jedna pod druga, kontener bez `max-width`.
W calym `features/dashboard`: 54x `sm:`, 8x `md:`, zero `lg:` / `xl:` / `2xl:`.

| Szerokosc | scrollHeight | Poziome przewijanie |
| --------- | -----------: | ------------------- |
| 390 px    |     4264 px  | nie                 |
| 1024 px   |     4419 px  | nie                 |
| 1440 px   |     4696 px  | nie                 |
| 1920 px   |     5016 px  | nie                 |

Kluczowa obserwacja: **strona rosnie wraz z szerokoscia ekranu**. 1920 px jest
o 752 px (17.6%) DLUZSZE niz 390 px, bo szersze karty rozciagaja wykresy i
paski postepu w pionie, a nic nie przenosi sie w poziom. To dokladna odwrotnosc
tego, czego oczekuje sie od ukladu desktopowego.

## Po refaktorze

Uklad: `grid grid-cols-1 gap-4 lg:grid-cols-12`, pas KPI 3x`lg:col-span-4`,
kolumna glowna `xl:col-span-8`, szyna `xl:col-span-4` z `xl:sticky xl:top-16`.
Kontener dostal `xl:max-w-[1440px] xl:px-8`.

| Szerokosc | przed  | po     | roznica          |
| --------- | -----: | -----: | ---------------- |
| 390 px    | 4264   | 4256   | −8 px (−0.2%)    |
| 1024 px   | 4419   | 3955   | −464 px (−10.5%) |
| 1440 px   | 4696   | 3446   | −1250 px (−26.6%)|
| 1920 px   | 5016   | 3581   | −1435 px (−28.6%)|

Kierunek sie odwrocil: strona przestala rosnac wraz z ekranem. Mobile stoi
w miejscu — to byl warunek, nie efekt uboczny.

Pomiar posredni: 1280 px (pierwsza szerokosc z podzialem na strefy) = 3373 px.
To najkrotszy wynik ze wszystkich — patrz uwaga o 1920 px nizej.

## Co sprawdzono recznie

Szerokosci 1024 / 1280 / 1440 / 1920, sidebar rozwiniety i zwiniety:

* **Poziome przewijanie** — nie wystapilo w zadnej kombinacji
  (`scrollWidth === clientWidth`). Nigdzie nie brakowalo `min-w-0`.
* **Sticky** — szyna zatrzymuje sie na 64 px, LinearTopBar konczy sie na 49 px.
  Na dole strony tresc szyny (573 px) konczy sie wysoko ponad dolem swojej
  komorki (821 px) i ponad `Footer` (837 px) — nie wystaje.
* **Zwiniety sidebar** — uklad bez zmian, karty szersze
  (kolumna glowna 741 → 880 px, szyna 363 → 432 px przy 1440 px).

## Kandydaci na Etap 2b

1. **Karty w pasie KPI nie wypelniaja swoich komorek.** Same komorki gridu maja
   rowna wysokosc (523 px przy 1440 px) — grid rozciaga je domyslnie, wiec
   `items-stretch` nic tu nie zmieni. Nierowna jest ZAWARTOSC: `EarningsCard`
   siega dna komorki, a `MonthlyGoalCard` i `EffectiveRateCard` koncza sie
   ~230 px wyzej. Lekarstwem jest `h-full` na samych kartach — czyli pliki
   `*Card.tsx`, celowo poza zakresem Etapu 2.
2. **1920 px jest o 135 px WYZSZE niz 1440 px** mimo `max-w-[1440px]`. Przy
   1440 px viewportu tresc ma 1120 px, przy 1920 px — 1376 px. Karty z wykresem
   o stalych proporcjach rosna w pionie razem z szerokoscia. To argument za
   nizszym limitem albo za `aspect-ratio` w wykresach.
3. **Gestosc wewnatrz kart** (`p-4`, `text-2xl`, `grid-cols-3` w `ActivityCard`) —
   ~10 plikow komponentow kart, osobny refaktor.
4. **Szyna a niskie viewporty.** Tresc szyny ma 455–509 px. Przy oknie nizszym
   niz ~570 px sticky przestanie miec sens (szyna nie zmiesci sie w ekranie).
   Dzis nie jest to problem, ale warto wiedziec, gdzie jest granica.
