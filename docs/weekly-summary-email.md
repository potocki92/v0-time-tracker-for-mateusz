# Automatyczna wysyłka skrótu tygodnia

Skrót przepracowanego tygodnia (ten sam tekst, który daje przycisk **Kopiuj**
w podsumowaniu tygodnia) leci raz w tygodniu na wskazany adres — np. do
księgowej.

- **Kiedy:** sobota 16:00 UTC (18:00 czasu polskiego latem, 17:00 zimą).
- **Za jaki tydzień:** bieżący, poniedziałek–niedziela.
- **Pusty tydzień:** brak przepracowanych dni = brak maila.
- **Dubel:** endpoint zapisuje ostatnio wysłany tydzień ISO, więc ręczne
  odpalenie workflow po cronie niczego nie wyśle drugi raz.

## 1) Migracja bazy

```bash
npx supabase db push        # albo `npx supabase db reset` lokalnie
```

Tworzy `public.weekly_summary_email_settings` (jeden wiersz na użytkownika,
RLS `auth.uid() = user_id`).

## 2) Hasło aplikacji do Gmaila

Zwykłe hasło do konta nie zadziała — Google wymaga hasła aplikacji:

1. Włącz weryfikację dwuetapową na koncie Google.
2. <https://myaccount.google.com/apppasswords> → utwórz hasło dla „Poczta”.
3. Skopiuj 16 znaków (bez spacji) — to jest `SMTP_PASS`.

## 3) Zmienne środowiskowe aplikacji

W Vercel → Settings → Environment Variables (i w `.env.local` na czas testów):

| Zmienna | Wartość | Uwagi |
| --- | --- | --- |
| `SMTP_USER` | pełny adres Gmail | nadawca |
| `SMTP_PASS` | hasło aplikacji z kroku 2 | nie hasło do konta |
| `SMTP_FROM` | opcjonalnie inny nadawca | domyślnie `SMTP_USER` |
| `SMTP_HOST` | opcjonalnie | domyślnie `smtp.gmail.com` |
| `SMTP_PORT` | opcjonalnie | domyślnie `465` (SMTPS); dla STARTTLS `587` |
| `SUPABASE_SERVICE_ROLE_KEY` | klucz service-role z Supabase | czyta ustawienia bez sesji użytkownika |
| `CRON_SECRET` | dowolny długi losowy ciąg | chroni endpoint crona |

Po dodaniu zmiennych wymagany jest redeploy — Vercel wstrzykuje je przy buildzie.

## 4) Sekrety GitHuba

Repozytorium → Settings → Secrets and variables → Actions:

| Sekret | Wartość |
| --- | --- |
| `APP_URL` | adres wdrożenia, bez ukośnika na końcu, np. `https://time-tracker-mateusz.vercel.app` |
| `CRON_SECRET` | dokładnie ten sam ciąg, co w zmiennych aplikacji |

Harmonogram siedzi w `.github/workflows/weekly-summary.yml`. Zakładka **Actions
→ Weekly Summary Email → Run workflow** odpala wysyłkę ręcznie.

## 5) Włączenie w aplikacji

Ustawienia konta → **Skrót tygodnia dla księgowej**:

1. Wpisz e-mail odbiorcy i zapisz.
2. **Wyślij teraz** — sprawdza całą ścieżkę (SMTP, dane, treść) od razu.
3. Przełącznik **Wysyłaj automatycznie** włącza sobotni cron.

„Wyślij teraz” nie oznacza tygodnia jako wysłanego — próba z ustawień nie
zabierze księgowej cotygodniowego maila.

## Diagnostyka

| Objaw | Przyczyna |
| --- | --- |
| `Brak konfiguracji poczty: ustaw SMTP_USER` | brakuje zmiennych z kroku 3 albo nie było redeployu |
| `Invalid login` z Gmaila | użyto hasła do konta zamiast hasła aplikacji |
| Workflow zwraca `401 Unauthorized` | `CRON_SECRET` w GitHubie ≠ `CRON_SECRET` w aplikacji |
| `Sent: 0, Skipped: 1` | tydzień już wysłany albo brak przepracowanych dni |
| Automat milczy, „Wyślij teraz” działa | wyłączony przełącznik albo brak sekretów w GitHubie |
