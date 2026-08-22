# Time Tracker for Mateusz

Production-grade time tracking and invoicing platform built with **Next.js App Router**, **React 19**, and **Supabase**. The application combines calendar-based work logging, client/project management, invoice lifecycle handling, and SEO-ready public pages.

## Project Overview

This codebase follows a **domain-oriented modular monolith** structure inside `app/(app)` while keeping shared UI and utilities in top-level folders (`components`, `hooks`, `lib`).

Core business domains:
- **Dashboard**: KPIs, charts, goals, unpaid invoice summaries.
- **Calendar**: daily entry tracking and month views.
- **Invoices**: invoice CRUD, status updates, listing, and export/presentation features.
- **Clients / Projects**: relationship and rate management.
- **Auth**: login/sign-up and protected app shell.

## High-Level Architecture

```text
Browser (React Client Components)
  -> App Router route segment
  -> Hooks (React Query / Zustand / local state)
  -> Domain service/fetcher layer
  -> Supabase / external API (NBP EUR rate)

Server Components + server fetchers
  -> Supabase server client (cookie-bound)
  -> pre-rendered payloads / metadata / SEO
```

### Architectural Principles

- **Separation of concerns**: route composition in `app/`, reusable UI in `components/`, stateful logic in `hooks/`, pure logic/config in `lib/`.
- **SOLID in practice**:
  - *Single Responsibility*: selectors, services, schemas, and presentation split by domain.
  - *Open/Closed*: forms are resolver-driven and field-configurable.
  - *Dependency Inversion*: features depend on abstractions (service interfaces/hook contracts), not direct view-layer coupling.
- **Clean Code**: clear naming, small files by concern, folder-level domain boundaries.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI primitives, shadcn-style UI composition |
| Data Fetching | TanStack React Query, native `fetch` revalidation |
| Backend | Supabase (auth, database, storage via SSR/browser clients) |
| Validation | Zod + React Hook Form (`@hookform/resolvers`) |
| State Management | Zustand (+ persist + immer), local component state |
| Charts / UX | Recharts, Framer Motion, Sonner toasts |
| Observability | Sentry, Vercel Analytics |

## Installation

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase project with required environment variables

### Setup

```bash
npm install
cp .env.example .env.local   # if available
npm run dev
```

Open: `http://localhost:3000`

Weekly summary e-mails (SMTP + cron secrets): [`docs/weekly-summary-email.md`](docs/weekly-summary-email.md)

## Development Workflow

1. **Run locally** using `npm run dev`.
2. **Develop by domain** in `app/(app)/<domain>` (`_components`, `_hooks`, `_services`, `_domain`).
3. **Extract reusable logic**:
   - UI to `components/`
   - Hooks to `hooks/`
   - Pure utilities/configuration to `lib/`
4. **Validate quality** with `npm run lint` and targeted manual route checks.
5. **Build check** before release: `npm run build`.

## Global Directory Structure

```text
.
├─ app/                 # App Router routes, layouts, page composition
├─ components/          # Reusable UI and domain UI modules
│  ├─ ui/               # Low-level design-system primitives
│  ├─ common/           # Cross-domain higher-level abstractions
│  ├─ invoices/         # Invoice-focused reusable components
│  ├─ seo/              # JSON-LD and SEO helpers at component level
│  └─ skeletons/        # Skeleton states for perceived performance
├─ hooks/               # Reusable hooks, stores, side-effect orchestration
├─ lib/                 # Pure utilities, schemas, service clients, config
└─ styles/              # Global style assets
```

## Design Decisions

- **Domain modules under `app/(app)`** preserve feature cohesion and reduce cross-domain leakage.
- **Server + Client split** is explicit to optimize performance and avoid unnecessary client bundles.
- **React Query defaults in global providers** keep cache/retry behavior consistent.
- **Form abstraction in `components/common/form`** standardizes validation UX and accessibility.
- **Centralized SEO metadata/JSON-LD** improves discoverability and prevents schema drift.
