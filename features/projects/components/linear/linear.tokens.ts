/**
 * Shared "Linear" dark palette. Single source of truth so the Projects
 * module never drifts from the Dashboard look & feel.
 *
 * Drabinka kontrastu (tło strony jest czarne #000):
 *   surface #101012 → rowSurface #151519 → surfaceElevated #17171a
 * Bez tego rozstawu karty i wiersze zlewały się z tłem w jedną płachtę.
 */
export const LINEAR = {
  surface: 'bg-[#101012]',
  surfaceElevated: 'bg-[#17171a]',
  surfaceHover: 'hover:bg-[#17171a]',
  rowSurface: 'bg-[#151519]',
  track: 'bg-[#26262c]',
  /** Szyna przy krawędzi karty — neutralna, akcent zarezerwowany dla aktywnych. */
  rail: 'bg-[#44444f]',
  border: 'border-[#2a2a30]',
  borderInset: 'border-[#212126]',
  divider: 'divide-[#212126]',
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-300',
  textMuted: 'text-zinc-400',
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400',
} as const
