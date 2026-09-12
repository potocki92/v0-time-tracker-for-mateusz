# work-automation

Automatyczne zapisywanie **rzeczywiście przepracowanych dni** do kalendarza.

Pełny opis reguł, modelu danych, stref czasowych, konfiguracji harmonogramu
i diagnostyki: [`docs/work-automation.md`](../../docs/work-automation.md).

## Harmonogram

```
Supabase Cron (pg_cron, job `work-automation-minute-tick`, `* * * * *`)
  └─ POST /api/cron/work-automation   Authorization: Bearer CRON_SECRET
       └─ runWorkAutomation → runAutomationForUser
```

Scheduler jest **jeden, globalny i bezstanowy** — woła endpoint co minutę i nie
zna żadnej reguły biznesowej. To `isDue` decyduje, czy lokalna godzina zapisu
danego konta już minęła, więc każdy użytkownik może mieć własną godzinę i własną
strefę IANA bez drugiego jobu. Duplikatów nie ma, bo dzień raz rozstrzygnięty
zamyka `work_automation_runs` (PK na `(user_id, local_date)`), a wpis —
`UNIQUE (user_id, date, entry_kind)` na `work_entries`.

GitHub Actions (`.github/workflows/work-automation.yml`) **nie ma już
harmonogramu** — został wyłącznie jako ręczny fallback diagnostyczny. Szczegóły,
sekrety Vault, weryfikacja i rollback: `docs/work-automation.md` §8.

## Podział modułu

- `domain/` — czysta logika i typy: reguły dat, grafiku i zjazdów, walidacja.
  Bez Reacta, bez bazy, bez ukrytego odczytu zegara.
- `services/` — dostęp do danych (`*.repository.server.ts`), wykonanie zadania
  (`*.runner.server.ts`) i dane sekcji ustawień (`*.overview.server.ts`).
- `actions.ts` — Server Actions dla interfejsu (sesja użytkownika, RLS).
- `components/`, `hooks/` — sekcja „Automatyczne zapisywanie pracy" w ustawieniach.

## Publiczne wejścia

| Import | Zawartość |
|---|---|
| `@/features/work-automation` | `WorkAutomationSection` — sekcja ustawień. |
| `@/features/work-automation/domain` | Typy, stałe, walidacja i czyste reguły. |
| `@/features/work-automation/server` | `runWorkAutomation` — dla route handlera crona. |

Wszystko głębiej jest prywatne.

## Najważniejsza funkcja

`decideDay` (`domain/workAutomation.decide.ts`) przyjmuje jawne dane
i rozpatrywaną datę, a zwraca decyzję z przyczyną. Używa jej i zadanie
serwerowe, i podgląd najbliższych siedmiu dni — dzięki temu podgląd nie może
rozjechać się z tym, co naprawdę zrobi automat.
