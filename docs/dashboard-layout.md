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
