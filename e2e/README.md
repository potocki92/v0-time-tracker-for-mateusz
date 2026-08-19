# Testy E2E

Cztery sciezki krytyczne: logowanie, zapis czasu pracy, wystawienie faktury,
eksport PDF. Suite **nie wchodzi** do `npm run verify` — wymaga bazy i
przegladarki, a `verify` ma zostac szybki i dzialac offline.

## Uruchomienie lokalne

```bash
npx supabase start

# `supabase status -o env` publikuje API_URL / ANON_KEY / SERVICE_ROLE_KEY,
# a aplikacja i seed czytaja inne nazwy — stad przepisanie ponizej.
eval "$(npx supabase status -o env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

export E2E_USER_EMAIL=e2e@example.test
export E2E_USER_PASSWORD=e2e-local-password-1234

npm run e2e:seed
npm run build && npm run e2e
```

`npm run e2e:ui` otwiera tryb interaktywny, `npm run e2e -- --headed` zwykla
przegladarke.

> `npm run build` czyta `NEXT_PUBLIC_*` w momencie budowania. Jesli trzymasz je
> w `.env.local`, wystarczy wyeksportowac `SUPABASE_SERVICE_ROLE_KEY` i
> `E2E_USER_*` — reszte Next wczyta sam.

## Jak to jest poskladane

| Plik | Rola |
|---|---|
| `seed.ts` | zaklada uzytkownika testowego, czysci jego dane, tworzy klienta `E2E Klient Testowy` i projekt |
| `auth.setup.ts` | loguje sie **raz** i zapisuje sesje do `.auth/user.json` |
| `fixtures/test-user.ts` | dane logowania z ENV (brak zmiennej = jasny blad, nie ciche `undefined`) |
| `*.spec.ts` | cztery sciezki krytyczne |

Projekt `setup` jest zaleznoscia projektow `chromium` i `mobile`, wiec kazdy
test startuje juz zalogowany — logowanie nie powtarza sie 10 razy.

Projekt `mobile` filtruje testy przez **`grep: /@mobile/`**, nie przez
`testMatch`. `testMatch` dopasowuje **sciezki plikow**, wiec tag w tytule
testu nigdy by w niego nie trafil — projekt byl by cicho pusty. Pilnuje tego
`__test__/config/e2e-suite.test.ts`.

## Seed dziala tylko na bazie lokalnej

`seed.ts` uzywa klucza service-role, ktory omija RLS. Dlatego przerywa, gdy
`NEXT_PUBLIC_SUPABASE_URL` nie wskazuje na `localhost` / `127.0.0.1` / `.local`.
Blokada jest w kodzie celowo — pomylka w zmiennej srodowiskowej skasowalaby
produkcyjne dane bez ostrzezenia.

Konto testowe (`e2e@example.test`) istnieje wylacznie w efemerycznej bazie
lokalnej i CI. **Nie podstawiaj tu zadnego sekretu produkcyjnego.**

## Zasady selektorow

Egzekwowane testem `__test__/config/e2e-suite.test.ts`:

- domyslnie `getByRole` / `getByLabel` / `getByText` — repo ma 125 `aria-label`,
  `role="alert"`, `role="tablist"`, `role="list"`;
- `getByTestId` **tylko punktowo**, gdy semantyka nie identyfikuje elementu
  jednoznacznie (dzis: komorka dnia w kalendarzu i wybor klienta w dialogu wpisu);
- **nigdy** `page.locator('.klasa')` ani `#id` — takie selektory lamie kazdy
  refaktor stylow;
- **nigdy** `waitForTimeout` — czekaj na stan (`expect`, `waitForURL`,
  `waitForEvent`).

## Katalogi robocze

`.auth/`, `.results/` i `.report/` sa w `.gitignore`. `.auth/user.json` zawiera
prawdziwe ciasteczka sesji i nie moze trafic do repo.
