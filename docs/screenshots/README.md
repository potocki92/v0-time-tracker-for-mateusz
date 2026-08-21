# Zrzuty ekranu panelu

Zrzuty wszystkich sekcji panelu w dwoch viewportach — material do przegladu
wizualnego zmian w UI. Kazdy przebieg nadpisuje te same pliki, wiec `git diff`
na tym katalogu pokazuje, co realnie zmienilo sie na ekranie.

> **Pliki PNG nie sa jeszcze w repo.** Generuje je `e2e/screenshots.spec.ts`,
> ktory potrzebuje dzialajacej aplikacji i zalogowanego konta testowego —
> patrz sekcja nizej. Do tego czasu miniatury w tabeli beda puste.

## Jak je odswiezyc

```bash
npm run e2e:seed                    # lokalna baza + konto testowe
npm run build
npm run e2e -- screenshots.spec.ts
```

Wymaga lokalnego Supabase i zmiennych `TEST_USER_A_EMAIL` / `TEST_USER_A_PASSWORD`
(patrz `e2e/README.md`). Zegar jest zamrozony na `2026-03-17T09:30:00Z`,
a animacje i przejscia wyzerowane — bez tego kazdy przebieg dawalby inny obraz.

## Sekcje

| Sekcja | Desktop (1440x900) | Mobile (390x844) |
| --- | --- | --- |
| Pulpit | [![Pulpit — desktop](desktop/dashboard.png)](desktop/dashboard.png) | [![Pulpit — mobile](mobile/dashboard.png)](mobile/dashboard.png) |
| Kalendarz | [![Kalendarz — desktop](desktop/calendar.png)](desktop/calendar.png) | [![Kalendarz — mobile](mobile/calendar.png)](mobile/calendar.png) |
| Projekty | [![Projekty — desktop](desktop/projects.png)](desktop/projects.png) | [![Projekty — mobile](mobile/projects.png)](mobile/projects.png) |
| Klienci | [![Klienci — desktop](desktop/clients.png)](desktop/clients.png) | [![Klienci — mobile](mobile/clients.png)](mobile/clients.png) |
| Faktury | [![Faktury — desktop](desktop/invoices.png)](desktop/invoices.png) | [![Faktury — mobile](mobile/invoices.png)](mobile/invoices.png) |
| Raporty | [![Raporty — desktop](desktop/reports.png)](desktop/reports.png) | [![Raporty — mobile](mobile/reports.png)](mobile/reports.png) |
