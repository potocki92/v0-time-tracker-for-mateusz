/**
 * Shared "Linear" dark palette. Single source of truth so the Projects
 * module never drifts from the Dashboard look & feel.
 */
export const LINEAR = {
  surface: 'bg-[#0a0a0a]',
  surfaceElevated: 'bg-[#0e0e0e]',
  surfaceHover: 'hover:bg-[#0c0c0c]',
  border: 'border-[#1a1a1a]',
  borderInset: 'border-[#161616]',
  divider: 'divide-[#161616]',
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-300',
  textMuted: 'text-zinc-500',
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500',
} as const
