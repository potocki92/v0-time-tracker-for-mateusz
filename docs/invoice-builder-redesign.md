# Invoice Builder Redesign — Senior's Note

This document accompanies the new `<InvoiceBuilder>` component
(`components/invoices/builder/`) and the supporting calculation engine
(`lib/finance/invoice-builder-engine.ts`). It explains the architectural
decisions a reviewer should challenge before we merge.

## Problem with the previous form

`components/invoices/invoice-form-dialog.tsx` (and its variant under
`app/(app)/invoices/_components/`) tracked an invoice as a single flat
`amount` number. Reasons that hurt:

- No line items → no per-position VAT, no JPK_FA round-trip, no PDF rendering
  beyond a header.
- `currency` was hard-coded to `'PLN' | 'EUR'`. No exchange rate, no foreign
  VAT, no reverse-charge support.
- Computations done with raw `Number(event.target.value || 0)`. Classic 0.1 +
  0.2 territory once we start summing 200 lines of fractional quantities.
- Mobile UX was a long top-to-bottom dialog with no escape hatch from the
  numeric keyboard.

The redesign keeps the legacy dialog reachable so we can migrate callers
gradually, and ships a new builder side-by-side.

## Layered architecture

```
                      ┌──────────────────────────────────────┐
React tree            │  <InvoiceBuilder> + section views    │  view layer
                      └──────────────────────────────────────┘
                                       ▲
                                       │ FormProvider (RHF)
                      ┌──────────────────────────────────────┐
Form state            │  useInvoiceBuilderForm + useFieldArr │  state hook
                      └──────────────────────────────────────┘
                                       ▲
                                       │ pure
                      ┌──────────────────────────────────────┐
Domain logic          │  invoice-builder-engine (bigint)     │  engine
                      │  invoice-builder.schema (zod)        │
                      └──────────────────────────────────────┘
```

The view layer never multiplies a price by a quantity; it asks the engine.
The engine has no React, no I/O, no async — it's a deterministic pure
function ideal for unit tests, JPK exports, PDF render and server-side
re-validation of submitted totals.

## Money: never use IEEE-754 for groszy

All money math goes through `bigint` arithmetic in the **minor unit** of the
invoice currency (grosze, cents, pence). A `MoneyAmount` is `{ amountMinor:
bigint, currency }` — the same approach used by Stripe, every accounting
engine, and `lib/finance/money.ts` already in the repo.

The engine multiplies by `quantity` and `vat_rate / 100` by lifting the
factor to **6 decimal places** of integer precision and then rounding
half-away-from-zero down to the nearest grosz. That eliminates the two
classes of float bugs we'd otherwise see:

- `0.1 + 0.2 === 0.30000000000000004` → groszy gained or lost across many
  lines.
- `(2 * 199.99) * 0.08` returning `31.998400000000004` and rounding to the
  wrong direction.

The unit tests in `__test__/finance/invoice-builder-engine.test.ts` pin
exact expected values (e.g. `1.5 * 199.99 @ 8% → net 299.99, vat 24.00`).
Any future refactor that breaks this will fail the suite.

We deliberately did **not** widen the app-wide `CURRENCY = 'PLN' | 'EUR'`
type — 33 other modules depend on it. The builder engine carries its own
wider currency union (`PLN | EUR | USD | GBP`) until persistence is updated
to support the additional codes end-to-end.

## VAT: standard rates plus three "modes"

Polish invoices can have a numeric rate (0/5/8/23) **or** one of three
non-numeric markers: `zw.` (zwolnione), `np.` (nie podlega), and
international reverse-charge. The schema models this as:

```ts
vat_mode: 'standard' | 'zw' | 'np' | 'rc'
vat_rate: number  // only meaningful when mode === 'standard'
```

`resolveVatRate()` collapses every special mode to a 0% effective rate, so
totals math is uniform. The summary table groups lines by **bucket key**
(`mode:rate`) so an invoice mixing 23%, 8%, and reverse-charge lines renders
three separate rows with their own subtotals — the layout regulators expect.
A boolean `has_special_vat` is emitted to drive a banner reminding the user
to add the legal annotation on the PDF.

## Responsive line items: cards on mobile, grid on desktop

Tabular invoice rows are unusable below ~700px — fields shrink to two
characters wide and the keyboard covers half the row. The redesign does
**two completely different layouts** wired to the same React Hook Form
state:

- **Mobile (`< 768px`)**: each line is an `<article>` card with stacked,
  labelled inputs. Sticky CTA at the bottom of the viewport.
- **Desktop (`≥ 768px`)**: a CSS-grid row that mirrors a header row
  (`grid-template-columns` matched on both). Drag handle, totals on the
  right.

Both render the *exact same* `<DescriptionField>`, `<QuantityField>`,
`<UnitPriceField>`, `<VatField>` primitives — they're React Hook Form
`Controller`s under the hood. That keeps validation, error display, and
keyboard tab order identical across breakpoints.

We avoid `<table>` because making `<tr>`/`<td>` reflow into cards requires
either `display: contents` (poor a11y), JS-driven cell unwrapping, or two
parallel DOMs. CSS grid + `useIsMobile` is simpler and survives a SSR
hydration mismatch (the hook returns `false` on the first render).

## Mobile keyboard: never `type="number"`

`MoneyInput` and `QuantityInput` use `type="text"` + `inputMode="decimal"`
+ `pattern="[0-9]*[.,]?[0-9]*"`. Reasons:

- `type="number"` blocks comma-as-decimal in `pl-PL` locales.
- It refuses intermediate values like `"12."` while the user is mid-type,
  causing the cursor to jump.
- It triggers the scroll-to-change gesture, which silently mutates amounts.
- `inputMode="decimal"` still gives iOS/Android the numeric keypad with a
  decimal separator.

We accept both `,` and `.` and normalise to `.` before parsing.

## Drag & drop with keyboard parity

`@dnd-kit/sortable` runs the line list. We register both a `PointerSensor`
(6px activation distance to avoid accidental drags during text selection)
and a `KeyboardSensor` (Space to pick up, arrow keys to move) — invoice
templating is a power-user task and many of those users live in the
keyboard. Drag is `restrictToVerticalAxis + restrictToParentElement` so the
cards can't drift sideways and disorient the user.

## Validation surface

- `invoiceBuilderSchema` enforces:
  - `due_date >= issue_date` (the original requirement).
  - `sale_date <= due_date` (sanity check from real-world rejected invoices).
  - At least 1 and at most 200 line items.
  - Per-line: positive quantity, non-negative price, valid VAT mode.
  - Optional FX rate must be positive when supplied.
- Tax IDs and SWIFT codes use coarse regex shape checks. Country-specific
  checksum validation (PL NIP, German USt-IdNr, etc.) is left for a follow-up
  using a dedicated library — out of scope here, and adding silent
  per-country logic now would create a long tail of false negatives.
- Every `<input>` carries `aria-invalid` driven by RHF state. Inline errors
  use `role="alert"` so screen readers announce them on submission.

## What's intentionally out of scope

- Wiring the new builder into the existing invoices page (`app/(app)/invoices`).
  The legacy dialog is still the only path to creation today; the new
  builder is exported from `components/invoices/builder` and ready to be
  dropped into a new route or a Drawer trigger when persistence has caught
  up with the schema.
- Persisting the new fields (counterparty, FX rate, payment, language) —
  requires DB columns and the `services/invoices.ts` write path to be
  extended. Filed as the next follow-up.
- Country-specific tax ID checksum validation (see Validation surface above).

## Files added

- `lib/schemas/invoice-builder.schema.ts` — zod schemas for the new shape.
- `lib/finance/invoice-builder-engine.ts` — pure calculation engine.
- `__test__/finance/invoice-builder-engine.test.ts` — 12 unit tests, 100%
  green (`npm test`).
- `components/invoices/builder/` — the new form: hook, sections, field
  primitives, dual line-item layouts, barrel.
- `docs/invoice-builder-redesign.md` — this note.

## Reviewer checklist

- [ ] Sanity-check the rounding strategy against your accounting team's
      house rule (we use half-away-from-zero, the JPK_FA default).
- [ ] Confirm the mobile breakpoint at 768px matches the rest of the app.
- [ ] Sign off on widening `CURRENCY` later or keeping the engine's union
      separate.
- [ ] Decide whether reverse charge needs an explicit annotation field on
      the invoice or whether the badge in `<SummarySection>` is enough for
      the PDF generator to pick up.
