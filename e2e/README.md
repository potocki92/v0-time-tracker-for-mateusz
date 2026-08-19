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

# Jeden zestaw zmiennych dla seeda, E2E i testow RLS.
export TEST_SUPABASE_URL="$API_URL"
export TEST_SUPABASE_ANON_KEY="$ANON_KEY"
export TEST_USER_A_EMAIL=a@example.test
export TEST_USER_A_PASSWORD=e2e-local-a-1234
export TEST_USER_B_EMAIL=b@example.test
export TEST_USER_B_PASSWORD=e2e-local-b-1234

npm run e2e:seed
npm run test:rls               # 11 testow polityk RLS, ~1 s
npm run build && npm run e2e
```

`npm run e2e:ui` otwiera tryb interaktywny, `npm run e2e -- --headed` zwykla
przegladarke.

> `npm run build` czyta `NEXT_PUBLIC_*` w momencie budowania. Jesli trzymasz je
> w `.env.local`, wystarczy wyeksportowac `SUPABASE_SERVICE_ROLE_KEY` i
> `TEST_*` — reszte Next wczyta sam.

## Jak to jest poskladane

| Plik | Rola |
|---|---|
| `seed.ts` | zaklada **dwoch** uzytkownikow (A i B), czysci ich dane, kazdemu tworzy klienta i projekt |
| `auth.setup.ts` | loguje sie **raz** i zapisuje sesje do `.auth/user.json` |
| `fixtures/test-user.ts` | dane logowania usera A z ENV (brak zmiennej = jasny blad, nie ciche `undefined`) |
| `*.spec.ts` | cztery sciezki krytyczne |
| `a11y.spec.ts` | skan axe (WCAG 2.1 AA) czterech tras panelu + kolejnosc focusa w logowaniu |

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

Konta testowe (`a@example.test`, `b@example.test`) istnieja wylacznie w efemerycznej
bazie lokalnej i CI. **Nie podstawiaj tu zadnego sekretu produkcyjnego.**

## Dwoch uzytkownikow

E2E loguje sie tylko jako user A. User B istnieje dla `__test__/rls.test.ts`:
bez jego klienta i projektu asercje "user A nie widzi cudzych rekordow"
przechodzilyby na pustym zbiorze, czyli nie sprawdzalyby niczego. Suite RLS
czyta te same zmienne `TEST_USER_A_*` co E2E — jeden zestaw zamiast dwoch
trzymanych w synchronizacji.

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
