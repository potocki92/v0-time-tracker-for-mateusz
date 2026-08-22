/**
 * Paleta „Linear" panelu — jedno źródło prawdy dla Pulpitu, Projektów,
 * Klientów, Faktur, Raportów i Kalendarza.
 *
 * Mieszka w `components/`, bo `__test__/config/module-boundaries.test.ts`
 * zabrania importów `features/*` → `features/*`. Wcześniej ten sam słownik
 * stał w dwóch kopiach: `features/projects/components/linear/linear.tokens.ts`
 * i `features/clients/components/clients.tokens.ts`.
 *
 * Drabinka kontrastu (tło strony to --surface-0):
 *   surface #101012 → rowSurface #151519 → surfaceElevated #17171a
 * Bez tego rozstawu karty i wiersze zlewały się z tłem w jedną płachtę.
 */
export const LINEAR = {
  surface: 'bg-surface-2',
  surfaceElevated: 'bg-surface-3',
  surfaceHover: 'hover:bg-surface-3',
  rowSurface: 'bg-surface-3',
  track: 'bg-[#26262c]',
  /** Szyna przy krawędzi karty — neutralna, akcent zarezerwowany dla aktywnych. */
  rail: 'bg-[#44444f]',
  border: 'border-hairline-strong',
  borderInset: 'border-hairline-strong',
  divider: 'divide-hairline-strong',
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-300',
  textMuted: 'text-zinc-400',
  eyebrow: 'text-2xs font-semibold uppercase tracking-[0.18em] text-zinc-400',
} as const

/**
 * Kanoniczne powierzchnie kart. Przed ujednoliceniem sekcje niosły 12 różnych
 * kombinacji `rounded-xl|2xl` + `border-*` + `bg-surface-*` — patrz
 * `docs/ui-audit.md`. Stałe, nie komponent: karty mają zbyt różną zawartość,
 * żeby opłacało się je zamykać w slotach.
 *
 * Pilnuje tego `__test__/config/ui-consistency.test.ts`.
 */
export const SURFACE = {
  /** Karta pierwszego poziomu — bezpośrednio na tle sekcji. */
  card: 'rounded-xl border border-hairline-strong bg-surface-2',
  /** Karta lub wiersz wewnątrz karty — o stopień jaśniejszy. */
  cardNested: 'rounded-lg border border-hairline-strong bg-surface-3',
  /** Pusty stan / miejsce na treść, której jeszcze nie ma. */
  cardDashed: 'rounded-xl border border-dashed border-hairline bg-surface-2',
} as const
