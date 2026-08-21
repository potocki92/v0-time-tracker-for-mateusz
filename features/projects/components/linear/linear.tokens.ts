/**
 * Shared "Linear" dark palette. Single source of truth so the Projects
 * module never drifts from the Dashboard look & feel.
 *
 * Drabinka kontrastu (tło strony jest czarne #000):
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
