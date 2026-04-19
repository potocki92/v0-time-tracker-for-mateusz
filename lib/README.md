# `/lib` Directory README

`/lib` hosts **framework-agnostic shared logic**: utility helpers, typed schemas, service clients, configuration, and cross-cutting business rules.

## Directory Responsibilities

| Subfolder/File | Responsibility |
|---|---|
| `supabase/` | Browser/server/proxy Supabase client setup |
| `schemas/` | Zod schemas for auth, invoices, clients |
| `query/` | React Query key factories and config |
| `finance/` | Currency/goal/earnings/totals domain math |
| `date/` | Date range and formatting helpers |
| `seo/` | Metadata and JSON-LD model builders |
| `api/` | External API integrations (e.g., NBP EUR rate) |
| `monitoring/` | Sentry/observability setup |
| `env.ts`, `types.ts`, `utils.ts` | Shared environment, types, and utility primitives |

## Utility & Business Logic Guidelines

- Keep this layer **side-effect light** and deterministic where possible.
- Prefer pure functions for finance/date transformations.
- Isolate external integrations behind small adapters.
- Keep runtime validation close to boundaries (schema layer).

## API Client Configuration

### Supabase Browser Client
- Created in `lib/supabase/client.ts` for client-side interactions.
- Uses public URL + anon key env vars.

### Supabase Server Client
- Created per request in `lib/supabase/server.ts` using Next.js cookies.
- Avoids global singleton to stay safe under server runtime concurrency.

| Function | Returns | Runtime |
|---|---|---|
| `createClient()` (`supabase/client.ts`) | Browser client | Client components/hooks |
| `createClient()` (`supabase/server.ts`) | Server client with cookie bridge | Server components/actions/services |

## Third-Party Wrappers & Configurations

- **NBP exchange rate wrapper** (`lib/api/eurRate.ts`): fetch + fallback behavior with Next revalidation hints.
- **SEO builders** (`lib/seo/*`): central source of metadata and JSON-LD schema nodes.
- **Monitoring integration** (`lib/monitoring/sentry.ts`): keeps instrumentation separate from feature code.

### Example: External API Wrapper Pattern

```ts
export async function fetchCurrentEurRate(): Promise<number | null> {
  const res = await fetch(NBP_URL, { next: { revalidate: 3600, tags: ['eur-rate'] } })
  if (!res.ok) return null
  const data = await res.json()
  return data.rates?.[0]?.mid ?? null
}
```

## Design Decisions

- **Boundary-driven architecture**: `/lib` sits between framework code and domain logic.
- **Typed contracts first**: schemas/types reduce invalid state propagation.
- **Small wrappers around third-party APIs**: simplifies replacement/testing and centralizes failure policy.
- **Centralized key/config modules**: avoids duplicated query keys, metadata, and environment parsing.
