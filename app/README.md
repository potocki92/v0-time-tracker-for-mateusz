# `/app` Directory README

This folder implements the **Next.js App Router** entrypoint and route composition layer.

## App Router Architecture

The routing tree is organized using route groups and feature segments:

- `app/layout.tsx`: global HTML shell, global providers, metadata, SEO JSON-LD.
- `app/page.tsx`: landing page.
- `app/auth/*`: authentication-focused pages and layouts.
- `app/(app)/*`: authenticated application surface (dashboard, clients, invoices, calendar, projects, settings).

### Route Group Strategy

- **`(app)` group** isolates authenticated UI shell from public/auth pages.
- Domain folders inside `(app)` follow a feature-first shape:

```text
_domain/      # types, selectors, constants
_components/  # page and section-level UI
_hooks/       # route-scoped hooks
_services/    # data access orchestration
```

## Server vs Client Components

### Server Components (default)
Used for:
- static/SSR content,
- metadata and SEO emission,
- server-side data orchestration where possible.

### Client Components (`'use client'`)
Used where interaction is required:
- app shell behavior (sidebar, mobile header, auth hooks),
- table interactions, dialogs, optimistic UI,
- form state and browser APIs.

### Practical Rule

| Component Type | Use When | Typical Files |
|---|---|---|
| Server Component | Rendering can be computed on server; no browser hooks needed | `page.tsx`, metadata helpers, server services |
| Client Component | Uses state/effects/events/browser-only APIs | interactive `layout.tsx`, dialogs, table toolbars |

## Layout Strategy

### Global Layout (`app/layout.tsx`)
Responsibilities:
- root document structure,
- global fonts, theme + color providers,
- analytics and toaster,
- global JSON-LD injection,
- metadata + viewport defaults.

### Auth Layouts (`app/auth/*/layout.tsx`)
- Provide focused experience for login/signup/error/success flows.
- Keep auth visuals and messaging isolated from app shell complexity.

### App Shell Layout (`app/(app)/layout.tsx`)
- Sidebar provider/inset orchestration.
- Mobile + desktop navigation variants.
- Main content focus management (`#main-content`) for accessibility.

## Loading State Strategy

Each major feature segment defines a `loading.tsx` boundary to provide immediate feedback:
- `calendar/loading.tsx`
- `clients/loading.tsx`
- `invoices/loading.tsx`

Pattern:
1. lightweight skeleton rendered instantly,
2. data-bearing UI streamed or hydrated,
3. section-level error boundaries inside feature components.

## Example: Route-Level Streaming-Friendly Composition

```tsx
// app/(app)/invoices/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function InvoicesSkeleton() {
  return <Skeleton className="h-8 w-36" />
}
```

## Design Decisions

- **Route groups over deeply nested monolith pages**: clearer ownership boundaries.
- **Feature-local `_services` + `_hooks`**: prevents route files from becoming god-components.
- **Loading boundaries per domain**: better perceived performance and failure isolation.
- **Client shell only where needed**: server-first defaults preserve performance characteristics.
