# Accounting — wykaz faktur dla ksiegowej

Modul odpowiada na jedno pytanie, ktore zadaje urzad skarbowy (w tym
niemiecki Finanzamt przy rozliczeniu rocznym):

> **jakie faktury zostaly wystawione, ZA JAKI okres, DLA KOGO i GDZIE praca
> zostala wykonana.**

To nie jest raport pracy ani analityka faktur. To DOKUMENT: rejestr sprzedazy
z okresem uslugi, blokiem adresowym nabywcy i miejscem wykonania, gotowy do
wyslania ksiegowej w PDF albo do zaimportowania w CSV.

---

## 1. Zakres odpowiedzialnosci

| Modul pokazuje | Modul NIE pokazuje |
| --- | --- |
| faktury z numerem, po dacie wystawienia | szkicow bez numeru (zlicza je osobno) |
| okres uslugi (`period_start`/`period_end`) | prognoz i planu (`entry_kind = predicted`) |
| nabywce: nazwa, adres, NIP / USt-IdNr. | DSO, cashflow, wiekowania naleznosci |
| miejsce wykonania z `projects.address` | stawek, marzy i wartosci pracy |
| netto / VAT / brutto, sumy per waluta i kwartal | kwot przeliczonych jednym kursem |

Dlaczego osobny modul, a nie kolejny eksport w `features/reports`: raport pracy
jest wyspa, ktora z zalozenia **nie analizuje faktur** (patrz jego README,
sekcja 1), a jego wlasny README zapowiada, ze wspolny przeglad laczacy prace
i faktury powinien byc osobna, swiadoma funkcja produktu. To jest ta funkcja.

Zaleznosc miedzy ekranami jest jedna i jest nia ADRES: menu eksportu raportu
ma odnosnik do `/reports/accounting`. Zaden kod nie przechodzi przez te granice.

---

## 2. Data flow

```
Supabase (RLS: auth.uid() = user_id)
        |  invoices     (zakres dat wystawienia + klient w WHERE)
        v
services/accounting.fetchers.server.ts     <- server-only, ETAP 1
        |  z okresow uslug liczy sie okno wpisow pracy (workWindowOf)
        v
        |  work_entries (okno + klient), clients, projects   <- ETAP 2, rownolegle
        v
services/accounting.service.server.ts      <- getAccountingDatasetServer()
        v
app/api/accounting/route.ts  (GET, private no-store)
        v
hooks/useAccountingQuery.ts  (React Query, klucz QUERY_KEYS.accounting)
        v
        AccountingDataset  { range, workWindow, invoices, entries, clients, projects }
        v
domain/statement.ts -> buildStatementModel(dataset, today)     <- CZYSTA FUNKCJA
        |   dataset.ts    kwoty, okres uslugi, nabywca, kwalifikacja faktury
        |   worksites.ts  „gdzie": adresy projektow w okresie faktury
        |   totals.ts     sumy per waluta i per kwartal
        v
        StatementModel  (gotowe liczby, zero surowych wierszy)
        v
components/*  — rysuja, nie licza
export: domain/export.ts (CSV) i components/export/StatementPdfDocument.tsx (PDF)
```

Prefetch serwerowy (`app/[locale]/(app)/reports/accounting/page.tsx`) sklada
**ten sam klucz cache**, ktory zlozy klient, wiec pierwsze wejscie nie pobiera
danych drugi raz. Dlatego `today` jedzie propsem z serwera — rozstrzyga takze
statusy faktur (SENT po terminie platnosci to OVERDUE).

---

## 3. Struktura katalogow

```
features/accounting/
├── index.ts                 publiczne API klienckie (widok + skeleton + granica bledu)
├── server.ts                publiczne API serwerowe (dataset + parser query params)
├── domain/                  CZYSTA logika: bez Reacta, bez Supabase, bez UI
│   ├── index.ts             publiczne wejscie domeny
│   ├── types.ts             wszystkie kontrakty modulu
│   ├── labels.ts            kontrakt etykiet DOKUMENTU (`messages/*/accounting.json`)
│   ├── range.ts             presety roczne/kwartalne + okno wpisow pracy
│   ├── dataset.ts           kwoty, okres uslugi, nabywca, „czy to faktura"
│   ├── worksites.ts         „gdzie": miejsca pracy w okresie faktury
│   ├── totals.ts            sumy per waluta i per kwartal
│   ├── export.ts            budowanie tresci CSV
│   └── statement.ts         buildStatementModel — jedyny orkiestrator
├── i18n/
│   └── document-labels.ts   leniwe wczytanie slownika w JEZYKU PLIKU
├── services/
│   ├── accounting.columns.ts        jawne listy kolumn i sufity odczytu
│   ├── accounting.fetchers.server.ts
│   ├── accounting.service.server.ts
│   └── accounting.query.ts          klucz + adres + konfiguracja zapytania
├── hooks/                   orkiestracja stanu — hooki NIE licza
│   ├── useAccountingFilters.ts      filtry w query params (nuqs)
│   ├── useAccountingQuery.ts        dataset z React Query
│   ├── useStatementModel.ts         memoizacja buildStatementModel
│   └── useStatementExport.ts        PDF / CSV
└── components/
    ├── StatementContent.tsx     zlozenie strony
    ├── StatementHeader.tsx
    ├── StatementSkeleton.tsx
    ├── errors/                  granica bledu
    ├── shared/                  StatementCard, StatementEmptyState
    ├── filters/                 zakres, klient, jezyk dokumentu
    ├── summary/                 sumy per waluta, kwartaly, ostrzezenia o lukach
    ├── table/                   rejestr (tabela na desktopie, karty na telefonie)
    └── export/                  menu eksportu + szablon PDF (lazy) + jego oprawa
```

---

## 4. Public API

Trzy wejscia, nic wiecej:

| Wejscie | Co wystawia | Kto uzywa |
| --- | --- | --- |
| `@/features/accounting` | `StatementContent`, `StatementSkeleton`, `StatementContentBoundary` | trasa `/reports/accounting` |
| `@/features/accounting/domain` | czyste typy i funkcje | trasa (parser filtrow), testy |
| `@/features/accounting/server` | `getAccountingDatasetServer`, `parseAccountingSearchParams`, `accountingQueryOptions` | `app/api/accounting`, prefetch w `page.tsx` |

Wszystko glebiej jest prywatne — pilnuje tego
`__test__/config/module-boundaries.test.ts` i regula ESLint
`no-restricted-imports`.

**Zaden inny feature nie importuje z `features/accounting`, i ten modul nie
importuje z zadnego innego feature'a** — takze z `invoices` i `reports`,
z ktorymi dzieli tabele w bazie, ale nie kod.

---

## 5. Najwazniejsze typy

| Typ | Rola |
| --- | --- |
| `StatementFilters` | preset, zakres wlasny, klient, **jezyk dokumentu** |
| `StatementRange` | zakres **domkniety obustronnie** |
| `AccountingDataset` | to, co przychodzi z serwera: zakres, okno pracy, faktury, wpisy, klienci, projekty |
| `StatementParty` | nabywca: nazwa, adres, kod, miasto, kraj, NIP / USt-IdNr. |
| `StatementWorksite` | miejsce pracy w okresie faktury: projekt, adres, od-do, dni, godziny |
| `StatementRow` | jedna faktura jako wiersz rejestru |
| `StatementCurrencyTotal` | suma w JEDNEJ walucie + rozbicie zaplacone / niezaplacone |
| `StatementQuarterTotal` | suma kwartalna per waluta |
| `StatementDocumentLabels` | kontrakt etykiet dokumentu (PDF i CSV) |
| `StatementModel` | komplet gotowy dla UI i dla dokumentu |

Konwencje: data kalendarzowa to zawsze `DateKey` (`"YYYY-MM-DD"`), pieniadze
to zawsze grosze/centy (int) z sufiksem `Minor`.

---

## 6. Ktore faktury wchodza do wykazu

```ts
isRegisteredInvoice(invoice) === Boolean(invoice.invoice_number) && status !== 'DRAFT'
```

* **Numer jest warunkiem.** Rejestr sprzedazy identyfikuje pozycje numerem,
  wiec dokument bez numeru nie jest jeszcze faktura — takze wtedy, gdy ktos
  zdazyl oznaczyc szkic jako oplacony. Pominiete dokumenty sa ZLICZANE
  (`draftCount`) i widac je na ekranie oraz w stopce PDF.
* **Faktury anulowane ZOSTAJA.** Bez nich w numeracji powstaje dziura, ktorej
  ksiegowa nie umie wytlumaczyc urzedowi. Do kwot „niezaplacone" nie wchodza.
* **Granice zakresu stawia domena, nie SQL.** Data wystawienia mieszka w dwoch
  kolumnach (`invoice_date` i legacy `issue_date`); zapytanie zaweza po obu
  (czyli szerzej, niz trzeba), a `buildStatementModel` odsiewa po dacie
  EFEKTYWNEJ. Jedno rozstrzygniecie, jedno miejsce.

---

## 7. Jak licza sie kwoty

Wszystko idzie przez `lib/finance/money` (bigint, zero floatow):

```
gross = gross_amount ?? amount
net   = net_amount ?? (gross - vat_amount) ?? gross
vat   = gross - net
```

Dzieki tej kolejnosci **`net + vat === gross` zawsze**, takze dla faktur
sprzed migracji rozbicia VAT — tam brutto bierze sie z `amount`, a VAT wychodzi
zerowy. Odwrotna kolejnosc (netto z `amount`, brutto doliczane) zmienialaby
kwote, ktora uzytkownik naprawde wystawil.

**Waluty nie sa sprowadzane do jednej kursem.** Faktura w EUR i faktura w PLN
sumuja sie osobno: kwota po przeliczeniu nie istnieje w zadnej ksiedze. Ta sama
zasada rzadzi `lib/finance/invoice-currency-totals`.

---

## 8. Skad bierze sie „gdzie" (Leistungsort)

Faktura nie ma wlasnego adresu wykonania i nie powinna go miec — to samo
miejsce trafia na wiele faktur, a przeprowadzka ekipy nie moze przepisywac
historii. Miejsce wyliczane jest z danych, ktore juz sa:

1. wez wpisy pracy tego samego klienta (`client_id`),
2. zawez do OKRESU USLUGI z faktury (`period_start`..`period_end`),
3. pogrupuj po projekcie — adres niesie `projects.address`,
4. `from`/`to` to skrajne dni **z praca** w tym projekcie, `workedDays` liczy
   ROZNE dni.

Konsekwencje, o ktorych trzeba wiedziec:

* **Faktura bez okresu uslugi nie ma miejsca wykonania.** Podstawienie daty
  wystawienia wygladaloby jak dane, a byloby zgadywaniem, wiec wykaz pokazuje
  luke i zlicza ja w `missingPeriodCount`.
* **Dni pracy faktury to ROZNE dni**, nie suma kolumny miejsc: ten sam dzien
  przepracowany w dwoch projektach jest jednym dniem pracy, choc wystepuje
  w dwoch wierszach.
* **Projekt bez adresu i wpisy bez projektu nie znikaja** — domena zwraca
  `null`, a etykiete zastepcza podstawia warstwa prezentacji, zeby godziny
  sie zgadzaly.
* Wpisy o statusie innym niz `worked` oraz plan (`entry_kind = 'predicted'`)
  nie wskazuja miejsca pracy.

### Okno wpisow pracy

Odczyt jest **dwuetapowy**, bo okno wpisow zalezy od faktur, ktore dopiero co
przyszly: `workWindowOf(range, okresy)` poszerza zakres wykazu o okresy uslug
wychodzace poza niego. Bez tego faktura ze stycznia za grudniowa prace mialaby
pusta kolumne „gdzie" — czyli dokladnie ta, o ktora pyta urzad.

---

## 9. Jezyk dokumentu vs jezyk interfejsu

To **dwie niezalezne osie** (patrz `docs/i18n.md`, sekcja 15). Panel obsluguje
wlasciciel konta, dokument czyta jego ksiegowa — i nie musza mowic tym samym
jezykiem.

* Wybor jezyka pliku stoi w pasku filtrow i siedzi w adresie (`?lang=de`),
  wiec „ten sam wykaz po niemiecku" da sie zapisac jako zakladke.
* Do klucza cache jezyk **nie wchodzi** — zmienia etykiety, nie dane.
* Slownik dokumentu wczytuje `i18n/document-labels.ts` wprost z
  `messages/<locale>/accounting.json`, klucz `document`. `useTranslations`
  by nie wystarczyl: zna wylacznie aktywny jezyk panelu.
* Ten sam jezyk dostaje FORMATTER (`createFormat(documentLocale)`), wiec
  niemiecki wykaz ma niemieckie daty i niemiecki zapis kwot.
* Zaden komunikat w `document.*` nie ma parametru ICU — dokument sklada zdania
  z gotowych etykiet i sformatowanych liczb, wiec slownik da sie wczytac bez
  silnika tlumaczen. Ksztalt pilnuje typ `StatementDocumentLabels`
  (przypisanie sprawdzane w `__test__/accounting/export.test.ts`), a komplet
  kluczy miedzy jezykami — `__test__/i18n/messages.test.ts`.

---

## 10. Eksporty

| Eksport | Dla kogo | Zawartosc |
| --- | --- | --- |
| PDF | ksiegowa i urzad | rejestr + rozbicie miejsc wykonania per faktura + sumy per waluta i kwartal + stopka metodologiczna |
| CSV | program ksiegowy / arkusz | jeden wiersz na fakture, na koncu sumy per waluta |

**CSV jest plikiem MASZYNOWYM, nie wydrukiem**: daty w ISO, kwoty z kropka
dziesietna i bez separatora tysiecy (`lib/finance/money` → `toDecimalString`,
liczone na bigintach), separator `;`, na poczatku BOM. Przecinkowy CSV polski
i niemiecki Excel otwiera jako jedna kolumne, a bez BOM czyta UTF-8 jako ANSI
i rozbija znaki w nazwach klientow. Do czytania oczami jest PDF.

PDF jest **poziomy** (A4 landscape): rejestr niesie numer, dwie daty, nabywce,
miejsce wykonania i trzy kwoty — w pionie kolumna „gdzie" zwezalaby sie do
jednego slowa na wiersz. W rejestrze widac dwa pierwsze adresy faktury, pelne
rozbicie stoi w sekcji „Miejsca wykonania pracy".

Obie sciezki sa asynchroniczne, bo obie musza najpierw wczytac slownik
w jezyku dokumentu; PDF dodatkowo ciagnie `@react-pdf/renderer` i szablon przez
`await import(...)`, wiec wejscie na trase ich nie pobiera.

### Jak dodac eksport

1. Zbuduj TRESC czysta funkcja w `domain/export.ts` (etykiety wchodza argumentem).
2. Dodaj akcje w `hooks/useStatementExport.ts` — ciezkie zaleznosci przez
   `await import(...)`, nigdy statycznie.
3. Dodaj pozycje w `components/export/StatementExportMenu.tsx` i klucze
   `export.*` w tlumaczeniach.
4. Test formatu w `__test__/accounting/export.test.ts`.

---

## 11. Luki w danych sa czescia dokumentu

`missingPeriodCount`, `missingLocationCount` i `draftCount` stoja NAD tabela
i w stopce PDF. Faktura bez okresu uslugi albo bez zarejestrowanej pracy nie
jest bledem aplikacji — jest brakiem w danych, ktory trzeba uzupelnic, zanim
plik pojdzie do urzedu. Ukrycie tego na ekranie oznaczaloby, ze ksiegowa
odkryje brak jako pierwsza.

---

## 12. Czego tu jeszcze nie ma

* **Bloku wystawcy.** Konto nie przechowuje nazwy firmy, adresu ani numeru
  podatkowego wlasciciela (`profiles` ma tylko imie, nazwisko i nazwe
  uzytkownika), wiec dokument ich nie drukuje — polowiczny blok wystawcy byl by
  gorszy niz jego brak. Gdy takie pola pojawia sie w ustawieniach konta,
  naglowek PDF jest miejscem, gdzie maja trafic.
* **Reverse charge / §13b UStG.** Modul pokazuje VAT taki, jaki stoi na
  fakturze; nie zna adnotacji o odwrotnym obciazeniu, bo `invoices` jej nie
  przechowuje.

---

## 13. Wydajnosc

* Wykaz pobiera **tylko swoj zakres** — rok fakturowania to kilkadziesiat
  dokumentow, rok pracy ok. 400 wpisow.
* Wpisy pracy sa indeksowane po kliencie RAZ (`indexEntriesByClient`). Bez tego
  kazda faktura przechodzilaby po wszystkich wpisach roku.
* `useStatementModel` memoizuje caly model — przewijanie tabeli nie przelicza
  agregacji.
* Rejestr stronicuje po 15 wierszy, wiec DOM nie rosnie z historia.
* `@react-pdf/renderer`, szablon PDF i slowniki dokumentu ida osobnymi chunkami.
* Budzet trasy pilnuje `performance-budgets.json` + `npm run perf:budget`.

---

## 14. Testy

```bash
npm run test -- __test__/accounting
```

| Plik | Co pilnuje |
| --- | --- |
| `__test__/accounting/range.test.ts` | presety roczne i kwartalne, inclusivity, okno wpisow pracy |
| `__test__/accounting/statement.test.ts` | kwalifikacja faktur, kwoty, waluty, kwartaly, „gdzie", „dla kogo", statusy |
| `__test__/accounting/export.test.ts` | format CSV, kontrakt etykiet dokumentu, nazwy plikow |
| `__test__/accounting/statement-content.test.tsx` | zlozenie strony: filtry z URL → klucz cache → sekcje UI |

---

## 15. Jak bezpiecznie usunac ten modul

Modul jest wyspa: zaden inny feature go nie importuje, a jedyne wyjscie na
zewnatrz to odnosnik URL w menu eksportu raportu.

1. `rm -rf features/accounting`
2. `rm -rf "app/[locale]/(app)/reports/accounting"` i `rm -rf app/api/accounting`
3. `rm messages/{pl,en,de}/accounting.json`, usun `'accounting'` z
   `MESSAGE_NAMESPACES` i trzy wpisy `accounting:` z `LOADERS`
   (`i18n/messages.ts`) oraz z `pickMessages` w `app/[locale]/(app)/layout.tsx`
4. `lib/workspace/sections.ts`: usun `'reports/accounting'` z `NESTED_LABEL_KEYS`,
   a klucz `nested['reports/accounting']` z trzech `navigation.json`
5. `features/reports/components/export/ReportsExportMenu.tsx`: usun pozycje
   z odnosnikiem i klucz `export.invoiceStatement` z trzech `reports.json`
6. `rm -rf __test__/accounting`, usun wpis trasy z `performance-budgets.json`
7. opcjonalnie `QUERY_KEYS.accounting` / `QUERY_CONFIG.accounting` w `lib/query`
   i `toDecimalString` w `lib/finance/money.ts`
