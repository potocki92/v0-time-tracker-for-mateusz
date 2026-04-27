# Micro-SaaS Feature Architecture (Next.js App Router)

## Proposed folder tree

```txt
features/
  dashboard/
    components/
    hooks/
    api/
    services/
    types/
  calendar/
    components/
    hooks/
    api/
    services/
    types/
  clients/
    components/
    hooks/
    api/
    services/
    types/
  invoices/
    components/
    hooks/
    api/
    services/
    types/
  projects/
    components/
    hooks/
    api/
    services/
    types/
  settings/
    components/
    hooks/
    api/
    services/
    types/
```

Rules:
- No cross-feature imports (`features/clients` must not import from `features/invoices`).
- Shared UI and generic hooks stay in `components/*` and `hooks/*` at the root.
- Supabase access is isolated in `services/*`.
- All server-state goes through TanStack Query hooks from `api/*`.
- Zustand is reserved for UI and local interaction state.

## Decoupled dashboard module

The dashboard module now lives under `features/dashboard` with all key layers:
- `components/*` — UI composition and section rendering.
- `hooks/*` — local logic and Zustand bridge hooks.
- `api/*` — TanStack Query hooks (`useDashboardPreferencesQuery`, etc.).
- `services/*` — direct Supabase transport.
- `types/*` — dashboard contracts.

## Linear chart styling notes (Tailwind CSS 4)

The chart container has been refactored to a Linear-inspired style:
- Gradient background shell using `bg-linear-to-b`.
- Subtle translucent border (`border-white/10`).
- Soft elevation with custom shadow values.
- High-contrast axis typography and muted gridlines.

See implementation in:
- `features/dashboard/components/chart/ChartBars.tsx`.

## TanStack Query + Supabase pattern

Preferred pattern:
1. Define transport in `services/*.service.ts`.
2. Wrap transport in query hooks in `api/*.ts`.
3. Consume query hooks from components/hooks.

Example:
- service: `features/dashboard/services/preferences.service.ts`
- query hook: `features/dashboard/api/useDashboardPreferences.ts`
- consumer: `features/dashboard/components/PreferencesProvider.tsx`
