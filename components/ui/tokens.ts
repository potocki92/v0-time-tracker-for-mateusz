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
  track: 'bg-track',
  /** Szyna przy krawędzi karty — neutralna, akcent zarezerwowany dla aktywnych. */
  rail: 'bg-rail',
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
 * Powierzchnie Pulpitu.
 *
 * Pulpit ma wlasna chrome karty — naglowek jest CZESCIA karty, a zwiniete
 * sekcje skladaja sie na jeden panel — wiec i wlasna, o stopien ciemniejsza
 * powierzchnie niz `SURFACE.card` (ta obsluguje Projekty, Klientow, Faktury
 * i Raporty; zmiana jej promienia albo tla przemalowalaby cztery sekcje przy
 * okazji jednej). Literaly stoja TU, a nie w `features/dashboard/**`, bo
 * `__test__/config/ui-consistency.test.ts` liczy powierzchnie kart po zrodlach
 * sekcji — kazda kopia w feature'rze jest tam nowym wariantem.
 *
 * Glebia idzie przez `.dashboard-card` / `.dashboard-canvas` z `app/globals.css`:
 * wlos wewnetrznego swiatla u gory karty i bardzo delikatny chlodny tint tla.
 * Zaden ciezki `box-shadow` — karta ma sie odcinac kontrastem, nie cieniem.
 */
export const DASHBOARD_SURFACE = {
  /** Karta sekcji Pulpitu i panel sekcji zwinietych. */
  card: 'rounded-2xl border border-hairline bg-surface-1',
  /** Wiersz / kafelek WEWNATRZ karty Pulpitu — o stopien jasniejszy. */
  nested: 'rounded-xl border border-hairline bg-surface-2',
} as const

/**
 * Skala intensywności heatmapy godzin (karta „Godziny" na Pulpicie).
 *
 * Pięć stopni na akcencie motywu zamiast zahardkodowanej zieleni: panel ma
 * pięć palet (`--chart-1` w `app/globals.css`), a poprzednia wersja karty
 * malowała się stałym odcieniem, więc na motywie pomarańczowym czy fioletowym
 * heatmapa była jedynym zielonym elementem ekranu.
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

/**
 * Warstwy overlayów panelu — JEDNO miejsce, w którym stoją z-indeksy.
 *
 * Wcześniej `ProjectFormDialog` i `ProjectDeleteDialog` nosiły wklejone
 * `z-[60]` / `z-[70]`, bo formularz projektu otwiera się NAD arkuszem listy,
 * a potwierdzenie usunięcia NAD formularzem. Magiczne liczby rozsiane po
 * featurach nie dają się uzgodnić — tu widać całą drabinkę naraz.
 *
 *   base    50 — overlay pierwszego poziomu (nad nagłówkiem panelu, z-30)
 *   stacked 60 — overlay otwarty z wnętrza innego overlaya
 *   popover 70 — listy Selecta/Popovera portalowane do <body> z wnętrza
 *                overlaya `stacked`; bazowe z-50 wypadłoby POD nim
 */
export const LAYER = {
  base: 'z-50',
  stacked: 'z-[60]',
  /** Dla `SelectContent`/`PopoverContent` renderowanych w overlayu `stacked`. */
  stackedPopover: 'z-[70]',
} as const

export type WorkspaceLayer = 'base' | 'stacked'
