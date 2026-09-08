export type ColorThemeId =
  | 'emerald'
  | 'ocean'
  | 'sunset'
  | 'violet'
  | 'graphite'

export interface ColorTheme {
  id: ColorThemeId
  name: string
  description: string
}

export const DEFAULT_COLOR_THEME: ColorThemeId = 'emerald'

export const COLOR_THEMES: readonly ColorTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Orzeźwiający szmaragd na neutralnym płótnie — nasz klasyk.',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Głęboki azur i morska mgła — skupienie i spokój.',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Ciepłe koralowo-pomarańczowe światło późnego popołudnia.',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Elegancka luksusowa purpura — nowoczesny, kreatywny look.',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Monochromatyczny editorial — maksimum kontrastu, minimum barwy.',
  },
] as const

const COLOR_THEME_IDS = new Set<ColorThemeId>(COLOR_THEMES.map((t) => t.id))

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && COLOR_THEME_IDS.has(value as ColorThemeId)
}

export const COLOR_THEME_STORAGE_KEY = 'app.color-theme'
export const COLOR_THEME_ATTRIBUTE = 'data-theme'
