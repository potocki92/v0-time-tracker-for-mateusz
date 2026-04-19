# `/components` Directory README

This directory contains reusable UI building blocks and cross-domain presentation components.

> Scope note: this document intentionally excludes `components/ui` internals and focuses on higher-level composition.

## Composition Strategy

Architecture follows a layered UI model:
1. **Primitive layer** (`/ui`): design-system atoms.
2. **Composable abstraction layer** (`/common`, `/seo`, `/skeletons`).
3. **Domain UI layer** (`/invoices`, `brand`).

### Key Principles
- Prefer **composition over inheritance**.
- Keep components **presentational**; move orchestration/business logic to hooks/services.
- Pass behavior via typed props and callbacks.
- Standardize accessibility attributes (`aria-*`, label linkage, focus states).

---

## `brand/`

Brand identity elements (e.g., logo and brand marks) used across navigation, auth screens, and marketing surfaces.

**Design Decisions**
- Brand components are intentionally small and stateless.
- Centralized branding avoids duplicated SVG/icon logic across routes.

---

## `common/`

Cross-domain high-level components. The most important module here is `common/form`.

### Form Architecture (`common/form`)

`UniversalForm` + `FormInput` + `FormWrapper` provide a reusable form platform on top of React Hook Form.

#### Core interfaces

| Type / Prop | Description |
|---|---|
| `resolver` | Validation adapter (`zodResolver(...)` etc.) |
| `defaultValues` | Initial form state |
| `onSubmit` | Submit callback (`SubmitHandler<T>`) |
| `fields` | Declarative field config for auto-rendered inputs |
| `children` | Render prop or JSX for custom composition |
| `disableOnSubmit` | Disables all fields during submission |

#### Validation & Data Flow

```tsx
<UniversalForm
  resolver={zodResolver(schema)}
  defaultValues={defaults}
  onSubmit={handleSubmit}
  fields={fields}
>
  <SubmitButton pendingLabel="Saving...">Save</SubmitButton>
</UniversalForm>
```

Validation sequence:
1. Resolver executes schema validation (e.g., Zod).
2. RHF stores field-level errors.
3. `FormInput` subscribes only to its own error state via `useFormState({ name })`.
4. Errors are rendered with animated feedback.

#### Reusable Input Abstractions

| Component | Responsibility |
|---|---|
| `FormInput` | Unified text/number/password/textarea rendering with labels and inline errors |
| `FormWrapper` | Visual/structural framing for title, description, footer |
| `SubmitButton` | Submission state handling + optional `requireValid` / `requireDirty` gating |

**Design Decisions**
- Uncontrolled registration (`register`) minimizes re-renders.
- Per-field subscriptions improve scalability for large forms.
- Resolver-agnostic contract enables Zod/Yup/custom validators without changing UI code.

---

## `invoices/`

Reusable invoice-centric components such as cards, stats, and dialog UI.

Typical responsibilities:
- invoice listing visualization,
- invoice status and amount presentation,
- dialog-driven create/edit flows,
- PDF upload/preview related UI.

### Example Props Contract (`InvoiceFormDialog`)

| Prop | Type | Purpose |
|---|---|---|
| `open` | `boolean` | Dialog visibility |
| `editingInvoice` | `Invoice \| null` | Edit vs create mode |
| `clients` | `Client[]` | Client select source |
| `formData` | `InvoiceFormState` | Controlled form model |
| `onFormDataChange` | updater callback | Immutable state updates |
| `onSave` | `() => void` | Persist action trigger |

**Design Decisions**
- Dialog remains UI-focused; persistence belongs to domain hooks/services.
- Controlled form state allows deterministic preview and side-effect handling.

---

## `seo/`

SEO-focused components for script/meta composition.

Implemented patterns:
- JSON-LD script emitters (`Organization`, `WebSite`, `SoftwareApplication`, `Breadcrumb`).
- Safe serialization for script injection.
- Global schema injection from root layout.

### Example JSON-LD Composition

```tsx
export function GlobalJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <SoftwareApplicationJsonLd />
    </>
  )
}
```

**Design Decisions**
- Component wrappers over raw `<script>` tags reduce schema drift.
- Centralized schema builders in `lib/seo` keep SEO data type-safe and reusable.

---

## `skeletons/`

Skeleton screens used to improve perceived performance during data load/hydration.

Patterns:
- keep structure close to final UI layout,
- maintain low visual complexity,
- avoid expensive client-only logic inside placeholders.

**Design Decisions**
- Skeletons are treated as first-class UX states, not ad-hoc placeholders.
- Segment-level loading boundaries pair naturally with dedicated skeleton components.
