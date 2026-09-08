# work-automation

Automatyczne zapisywanie **rzeczywiście przepracowanych dni** do kalendarza.

Pełny opis reguł, modelu danych, stref czasowych, konfiguracji harmonogramu
i diagnostyki: [`docs/work-automation.md`](../../docs/work-automation.md).

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
