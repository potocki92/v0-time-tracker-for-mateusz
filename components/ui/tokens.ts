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
  card: 'rounded-2xl border border-hairline-strong bg-surface-2',
  /** Karta lub panel wewnątrz karty — o stopień jaśniejszy i o stopień mniej zaokrąglony. */
  cardNested: 'rounded-xl border border-hairline-strong bg-surface-3',
  /** Pusty stan / miejsce na treść, której jeszcze nie ma. */
  cardDashed: 'rounded-2xl border border-dashed border-hairline bg-surface-2',
} as const

/**
 * Skala intensywności heatmapy godzin (karta „Godziny" na Pulpicie).
 *
 * Pięć stopni na akcencie motywu zamiast zahardkodowanego emeralda: panel ma
 * pięć palet (`--chart-1` w `app/globals.css`), a poprzednia wersja karty
 * malowała się `bg-emerald-*` i `bg-[#101410]`, więc na motywie pomarańczowym
 * czy fioletowym heatmapa była jedynym zielonym elementem ekranu.
 *
 * Wartości idą w `style`, nie w klasę: `color-mix` z zmienną CSS w arbitralnej
 * klasie Tailwinda jest odporny na literówki dopiero po zbudowaniu, a tu
 * pomyłka byłaby niewidoczna aż do zmiany motywu.
 */
export const HEATMAP_LEVELS = [
  'color-mix(in oklab, var(--chart-1) 8%, var(--surface-2))',
  'color-mix(in oklab, var(--chart-1) 30%, var(--surface-2))',
  'color-mix(in oklab, var(--chart-1) 55%, var(--surface-2))',
  'color-mix(in oklab, var(--chart-1) 78%, var(--surface-2))',
  'var(--chart-1)',
] as const
