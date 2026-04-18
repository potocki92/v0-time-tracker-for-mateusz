export type ColorThemeId =
  | 'emerald'
  | 'ocean'
  | 'sunset'
  | 'violet'
  | 'graphite'

export interface ColorThemePreview {
  /** Kolor tła karty z podglądem (light). */
  background: string
  /** Kolor tła karty z podglądem (dark). */
  backgroundDark: string
  /** Akcent 1 — primary. */
  primary: string
  /** Akcent 2 — secondary highlight. */
  accent: string
  /** Akcent 3 — tertiary. */
  tertiary: string
}

export interface ColorTheme {
  id: ColorThemeId
  name: string
  description: string
  preview: ColorThemePreview
}

export const DEFAULT_COLOR_THEME: ColorThemeId = 'emerald'

export const COLOR_THEMES: readonly ColorTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Orzeźwiający szmaragd na neutralnym płótnie — nasz klasyk.',
    preview: {
      background: 'oklch(0.98 0.002 240)',
      backgroundDark: 'oklch(0.13 0.01 250)',
      primary: 'oklch(0.55 0.18 160)',
      accent: 'oklch(0.65 0.14 200)',
      tertiary: 'oklch(0.70 0.16 80)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Głęboki azur i morska mgła — skupienie i spokój.',
    preview: {
      background: 'oklch(0.98 0.008 230)',
      backgroundDark: 'oklch(0.14 0.03 250)',
      primary: 'oklch(0.55 0.18 230)',
      accent: 'oklch(0.70 0.13 260)',
      tertiary: 'oklch(0.72 0.13 160)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Ciepłe koralowo-pomarańczowe światło późnego popołudnia.',
    preview: {
      background: 'oklch(0.985 0.008 60)',
      backgroundDark: 'oklch(0.15 0.02 25)',
      primary: 'oklch(0.64 0.20 35)',
      accent: 'oklch(0.70 0.17 60)',
      tertiary: 'oklch(0.62 0.18 340)',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Elegancka luksusowa purpura — nowoczesny, kreatywny look.',
    preview: {
      background: 'oklch(0.985 0.006 300)',
      backgroundDark: 'oklch(0.14 0.02 300)',
      primary: 'oklch(0.55 0.22 295)',
      accent: 'oklch(0.65 0.18 320)',
      tertiary: 'oklch(0.62 0.18 255)',
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Monochromatyczny editorial — maksimum kontrastu, minimum barwy.',
    preview: {
      background: 'oklch(0.985 0 0)',
      backgroundDark: 'oklch(0.12 0 0)',
      primary: 'oklch(0.25 0 0)',
      accent: 'oklch(0.48 0 0)',
      tertiary: 'oklch(0.65 0 0)',
    },
  },
] as const

const COLOR_THEME_IDS = new Set<ColorThemeId>(COLOR_THEMES.map((t) => t.id))

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && COLOR_THEME_IDS.has(value as ColorThemeId)
}

export const COLOR_THEME_STORAGE_KEY = 'app.color-theme'
export const COLOR_THEME_ATTRIBUTE = 'data-theme'
