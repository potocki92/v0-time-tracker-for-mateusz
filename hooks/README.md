# `/hooks` Directory README

This directory contains reusable React hooks for data orchestration, UI behavior, state persistence, and side-effect management.

## Hook Categories

- `auth/`: authentication state and mutation hooks.
- `prefetch/`: route/data prefetch utilities.
- `stores/`: Zustand-backed global client state.
- root hooks: cross-domain utilities (`useLocalStorage`, `useUndoableAction`, connectivity/haptics, etc.).

## State Management Patterns

### 1) Remote Server State
Handled with **TanStack React Query** in feature hooks and provider defaults.

### 2) Client Global UI State
Handled with **Zustand** stores (`stores/`) and optional persistence strategy.

### 3) Local Durable State
Handled with specialized hooks such as `useLocalStorage` for browser persistence with SSR-safe hydration.

## Side-Effect Handling Strategy

- Keep side effects encapsulated in hooks (not in presentational components).
- Use optimistic workflows only where UX benefit is clear.
- Expose small, stable APIs (`value`, `setValue`, `execute`, etc.).

---

## Key Hook APIs

### `useLocalStorage`
SSR-safe local storage state with pluggable serializer/validator.

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | localStorage key |
| `defaults` | `T \| (() => T)` | Initial state/default factory |
| `options.ssrSafe` | `boolean` | Delay storage read until mount |
| `options.serialize` | `(value: T) => string` | Custom serializer |
| `options.deserialize` | `(raw: string) => T` | Custom parser |
| `options.validate` | type guard | Runtime validation of parsed value |

```ts
const [prefs, setPrefs, { isHydrated, reset }] = useLocalStorage(
  'dashboard-prefs',
  { range: 'current_month' },
  { ssrSafe: true }
)
```

### `useUndoableAction`
Implements delayed commit with undo toast for optimistic UX.

| Option | Type | Description |
|---|---|---|
| `action` | `(payload) => Promise<void>` | Deferred server action |
| `onOptimistic` | `(payload) => void` | Immediate UI update |
| `onUndo` | `(payload) => void` | Rollback callback |
| `undoDelay` | `number` | Undo time window in ms |

```ts
const { execute } = useUndoableAction({
  action: saveInvoiceStatus,
  onOptimistic: applyLocalPaidState,
  onUndo: rollbackLocalPaidState,
  undoDelay: 5000,
})

execute({ invoiceId, isPaid: true }, `invoice-${invoiceId}`)
```

### Zustand Store Pattern (`stores/useUiStore.ts`)

- Uses `persist` + `immer` middleware.
- Persists only selected slices via `partialize`.
- Exposes atomic selectors for render efficiency.

```ts
const range = useDashboardRange()
const setRange = useSetRange()
setRange('current_month')
```

## Design Decisions

- **Hooks as orchestration boundary**: components remain declarative and testable.
- **SSR-aware persistence**: avoids hydration mismatches.
- **Undo-first UX for destructive/committal actions**: fewer accidental writes and better trust.
- **Atomic selectors in stores**: minimizes unnecessary React re-renders.
